import { NextResponse } from "next/server";

import { revisarAlertasDe } from "@/lib/alertasServidor";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST() {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getClaims();
  const asesorId = data?.claims.sub;
  if (!asesorId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const nuevas = await revisarAlertasDe(sb, asesorId);
    return NextResponse.json({ creadas: nuevas.length });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "No se pudieron revisar las alertas";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
