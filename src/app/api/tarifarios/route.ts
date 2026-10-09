import { NextResponse } from "next/server";
import { extractTextItems, getDocumentProxy } from "unpdf";
import * as XLSX from "xlsx";

import { ISAPRES } from "@/config/isapres";
import { leerTarifario, type PalabraTarifa, type TarifarioLeido } from "@/lib/tarifario";
import { leerTarifarioMasvida } from "@/lib/tarifarioMasvida";
import { jsonTarifario } from "@/lib/supabase/tarifarios";
import { supabaseServer } from "@/lib/supabase/server";
import type { IsapreId } from "@/types/isapre";

const MAX_BYTES = 8 * 1024 * 1024;

function esIsapre(valor: string): valor is IsapreId {
  return ISAPRES.some((isapre) => isapre.id === valor);
}

function esExcel(archivo: File): boolean {
  const nombre = archivo.name.toLowerCase();
  return (
    nombre.endsWith(".xlsx") ||
    nombre.endsWith(".xls") ||
    archivo.type.includes("spreadsheet") ||
    archivo.type.includes("excel")
  );
}

async function leerPdf(archivo: File): Promise<TarifarioLeido> {
  const pdf = await getDocumentProxy(new Uint8Array(await archivo.arrayBuffer()));
  const { items } = await extractTextItems(pdf);
  const paginas: PalabraTarifa[][] = [];
  for (let i = 0; i < items.length; i++) {
    const palabras = items[i];
    if (!palabras) continue;
    const pagina = await pdf.getPage(i + 1);
    const altura = pagina.getViewport({ scale: 1 }).height;
    paginas.push(
      palabras
        .filter((item) => item.str.trim())
        .map((item) => ({
          texto: item.str.trim(),
          x: item.x,
          y: altura - item.y - item.height,
        })),
    );
  }
  return leerTarifario(paginas);
}

function leerExcel(buffer: ArrayBuffer): TarifarioLeido {
  const libro = XLSX.read(buffer, { type: "array" });
  return leerTarifarioMasvida(
    libro.SheetNames.flatMap((nombre) => {
      const hoja = libro.Sheets[nombre];
      if (!hoja) return [];
      return [{ nombre, filas: XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, raw: true, defval: null }) }];
    }),
  );
}

export async function POST(request: Request) {
  const sb = await supabaseServer();
  const { data: usuario } = await sb.auth.getUser();
  if (!usuario.user) return NextResponse.json({ error: "Inicia sesión para cargar un tarifario." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const isapreId = form?.get("isapreId");
  const archivo = form?.get("archivo");
  if (typeof isapreId !== "string" || !esIsapre(isapreId)) {
    return NextResponse.json({ error: "Elige la Isapre del tarifario." }, { status: 400 });
  }
  if (!(archivo instanceof File) || archivo.size === 0 || archivo.size > MAX_BYTES) {
    return NextResponse.json({ error: "Adjunta el tarifario, de hasta 8 MB." }, { status: 400 });
  }

  const excel = isapreId === "nueva-masvida";
  if (excel && !esExcel(archivo)) {
    return NextResponse.json({ error: "Nueva Masvida se carga con el Excel del tarifario." }, { status: 400 });
  }
  if (!excel && archivo.type && archivo.type !== "application/pdf" && !archivo.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Esta Isapre se carga con el PDF del tarifario." }, { status: 400 });
  }

  let leido;
  try {
    leido = excel ? leerExcel(await archivo.arrayBuffer()) : await leerPdf(archivo);
  } catch {
    return NextResponse.json({ error: excel ? "No pude abrir ese Excel." : "No pude abrir ese PDF." }, { status: 422 });
  }

  if (leido.planes.length === 0) {
    return NextResponse.json({ error: "No encontré planes con precio base en ese archivo." }, { status: 422 });
  }

  const { error } = await sb.from("tarifarios").upsert(
    {
      asesor_id: usuario.user.id,
      isapre_id: isapreId,
      titulo: leido.titulo,
      ...jsonTarifario(leido),
    },
    { onConflict: "asesor_id,isapre_id" },
  );
  if (error?.code === "42P01" || error?.code === "PGRST205") {
    return NextResponse.json({ error: "Falta correr la migración de tarifarios." }, { status: 503 });
  }
  if (error) return NextResponse.json({ error: "No se pudo guardar el tarifario." }, { status: 500 });

  return NextResponse.json({
    titulo: leido.titulo,
    planes: leido.planes.length,
    productos: leido.productos.length,
  });
}

export async function DELETE(request: Request) {
  const sb = await supabaseServer();
  const { data: usuario } = await sb.auth.getUser();
  if (!usuario.user) return NextResponse.json({ error: "Inicia sesión para quitar un tarifario." }, { status: 401 });

  const isapreId = new URL(request.url).searchParams.get("isapreId") ?? "";
  if (!esIsapre(isapreId)) return NextResponse.json({ error: "Elige la Isapre del tarifario." }, { status: 400 });

  const { error } = await sb.from("tarifarios").delete().eq("isapre_id", isapreId);
  if (error) return NextResponse.json({ error: "No se pudo quitar el tarifario." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
