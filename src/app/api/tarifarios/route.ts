import { NextResponse } from "next/server";

import { esIsapre, leerArchivoTarifario } from "@/lib/tarifarioArchivo";
import { puedeEscribirTarifario } from "@/lib/tarifariosCuenta";
import { hayTarifarioCompartible, jsonTarifario } from "@/lib/supabase/tarifarios";
import { supabaseServer } from "@/lib/supabase/server";
import { nivelDeSuscripcion, obtenerSuscripcion } from "@/lib/supabase/suscripciones";
import { permite } from "@/lib/suscripcion";

const faltaTabla = (code?: string) => code === "42P01" || code === "PGRST205";

export async function POST(request: Request) {
  const sb = await supabaseServer();
  const { data: usuario } = await sb.auth.getUser();
  if (!usuario.user) return NextResponse.json({ error: "Inicia sesión para cargar un tarifario." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const isapreCampo = form?.get("isapreId");
  const lecturaArchivo = await leerArchivoTarifario(typeof isapreCampo === "string" ? isapreCampo : "", form?.get("archivo") ?? null);
  if (!lecturaArchivo.ok) return NextResponse.json({ error: lecturaArchivo.error }, { status: lecturaArchivo.status });

  let nivel;
  let reemplazo: boolean;
  try {
    const lectura = await obtenerSuscripcion(sb);
    nivel = await nivelDeSuscripcion(sb, lectura);
    reemplazo = await hayTarifarioCompartible(sb, lecturaArchivo.isapreId);
  } catch {
    return NextResponse.json({ error: "No se pudo verificar el plan." }, { status: 500 });
  }
  if (!puedeEscribirTarifario(nivel, reemplazo)) {
    return NextResponse.json({ error: "Tu plan no incluye cargar un tarifario nuevo." }, { status: 403 });
  }

  const { error } = await sb.from("tarifarios").upsert(
    {
      asesor_id: usuario.user.id,
      isapre_id: lecturaArchivo.isapreId,
      titulo: lecturaArchivo.leido.titulo,
      ...jsonTarifario(lecturaArchivo.leido),
    },
    { onConflict: "asesor_id,isapre_id" },
  );
  if (faltaTabla(error?.code)) return NextResponse.json({ error: "Falta correr la migración de tarifarios." }, { status: 503 });
  if (error) return NextResponse.json({ error: "No se pudo guardar el tarifario." }, { status: 500 });

  const oculto = await sb.from("tarifarios_ocultos").delete().eq("isapre_id", lecturaArchivo.isapreId);
  if (oculto.error && !faltaTabla(oculto.error.code)) {
    return NextResponse.json({ error: "No se pudo guardar el tarifario." }, { status: 500 });
  }

  return NextResponse.json({
    titulo: lecturaArchivo.leido.titulo,
    planes: lecturaArchivo.leido.planes.length,
    productos: lecturaArchivo.leido.productos.length,
  });
}

export async function DELETE(request: Request) {
  const sb = await supabaseServer();
  const { data: usuario } = await sb.auth.getUser();
  if (!usuario.user) return NextResponse.json({ error: "Inicia sesión para quitar un tarifario." }, { status: 401 });

  const isapreId = new URL(request.url).searchParams.get("isapreId") ?? "";
  if (!esIsapre(isapreId)) return NextResponse.json({ error: "Elige la Isapre del tarifario." }, { status: 400 });

  try {
    const lectura = await obtenerSuscripcion(sb);
    const nivel = await nivelDeSuscripcion(sb, lectura);
    if (!permite(nivel, "isapres") && !permite(nivel, "tarifarios")) {
      return NextResponse.json({ error: "Tu plan no incluye los tarifarios." }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "No se pudo verificar el plan." }, { status: 500 });
  }

  const quitado = await sb.from("tarifarios").delete().eq("isapre_id", isapreId);
  if (quitado.error) return NextResponse.json({ error: "No se pudo quitar el tarifario." }, { status: 500 });

  const { error } = await sb.from("tarifarios_ocultos").upsert(
    { asesor_id: usuario.user.id, isapre_id: isapreId },
    { onConflict: "asesor_id,isapre_id" },
  );
  if (faltaTabla(error?.code)) {
    return NextResponse.json({ error: "Falta aplicar la migración de tarifarios compartidos." }, { status: 503 });
  }
  if (error) return NextResponse.json({ error: "No se pudo quitar el tarifario." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
