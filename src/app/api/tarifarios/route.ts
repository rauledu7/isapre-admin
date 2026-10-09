import { NextResponse } from "next/server";
import { extractTextItems, getDocumentProxy } from "unpdf";

import { ISAPRES } from "@/config/isapres";
import { leerTarifario, type PalabraTarifa } from "@/lib/tarifario";
import { jsonTarifario } from "@/lib/supabase/tarifarios";
import { supabaseServer } from "@/lib/supabase/server";
import type { IsapreId } from "@/types/isapre";

const MAX_BYTES = 8 * 1024 * 1024;

function esIsapre(valor: string): valor is IsapreId {
  return ISAPRES.some((isapre) => isapre.id === valor);
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
    return NextResponse.json({ error: "Adjunta el PDF del tarifario, de hasta 8 MB." }, { status: 400 });
  }
  if (archivo.type && archivo.type !== "application/pdf") {
    return NextResponse.json({ error: "El archivo tiene que ser un PDF." }, { status: 400 });
  }

  let leido;
  try {
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
    leido = leerTarifario(paginas);
  } catch {
    return NextResponse.json({ error: "No pude abrir ese PDF." }, { status: 422 });
  }

  if (leido.planes.length === 0) {
    return NextResponse.json({ error: "No encontré planes con precio base en ese PDF." }, { status: 422 });
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
