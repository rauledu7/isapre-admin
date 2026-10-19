import { NextResponse } from "next/server";

import { esIsapre, leerArchivoTarifario } from "@/lib/tarifarioArchivo";
import { clienteSuperAdmin } from "@/lib/supabase/adminAsesores";
import { aTarifario, jsonTarifario } from "@/lib/supabase/tarifarios";

const faltaTabla = (code?: string) => code === "42P01" || code === "PGRST205";

export async function GET() {
  const acceso = await clienteSuperAdmin();
  if ("error" in acceso) return NextResponse.json({ error: acceso.error }, { status: acceso.status });

  const { data, error } = await acceso.admin.from("tarifarios_base").select("isapre_id, titulo, planes, productos");
  if (faltaTabla(error?.code)) {
    return NextResponse.json({ error: "Falta aplicar la migración de tarifarios compartidos." }, { status: 503 });
  }
  if (error) return NextResponse.json({ error: "No se pudieron cargar los tarifarios." }, { status: 500 });

  const tarifarios = (data ?? []).flatMap((fila) => {
    const tarifario = aTarifario(fila);
    if (!tarifario) return [];
    return [{ isapreId: tarifario.isapreId, titulo: tarifario.titulo, planes: tarifario.planes.length, productos: tarifario.productos.length }];
  });
  return NextResponse.json({ tarifarios });
}

export async function POST(request: Request) {
  const acceso = await clienteSuperAdmin();
  if ("error" in acceso) return NextResponse.json({ error: acceso.error }, { status: acceso.status });

  const form = await request.formData().catch(() => null);
  const isapreCampo = form?.get("isapreId");
  const lectura = await leerArchivoTarifario(typeof isapreCampo === "string" ? isapreCampo : "", form?.get("archivo") ?? null);
  if (!lectura.ok) return NextResponse.json({ error: lectura.error }, { status: lectura.status });

  const { error } = await acceso.admin.from("tarifarios_base").upsert(
    { isapre_id: lectura.isapreId, titulo: lectura.leido.titulo, ...jsonTarifario(lectura.leido) },
    { onConflict: "isapre_id" },
  );
  if (faltaTabla(error?.code)) {
    return NextResponse.json({ error: "Falta aplicar la migración de tarifarios compartidos." }, { status: 503 });
  }
  if (error) return NextResponse.json({ error: "No se pudo guardar el tarifario." }, { status: 500 });

  return NextResponse.json({
    titulo: lectura.leido.titulo,
    planes: lectura.leido.planes.length,
    productos: lectura.leido.productos.length,
  });
}

export async function DELETE(request: Request) {
  const acceso = await clienteSuperAdmin();
  if ("error" in acceso) return NextResponse.json({ error: acceso.error }, { status: acceso.status });

  const isapreId = new URL(request.url).searchParams.get("isapreId") ?? "";
  if (!esIsapre(isapreId)) return NextResponse.json({ error: "Elige la Isapre del tarifario." }, { status: 400 });

  const { error } = await acceso.admin.from("tarifarios_base").delete().eq("isapre_id", isapreId);
  if (faltaTabla(error?.code)) {
    return NextResponse.json({ error: "Falta aplicar la migración de tarifarios compartidos." }, { status: 503 });
  }
  if (error) return NextResponse.json({ error: "No se pudo quitar el tarifario." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
