import { NextResponse } from "next/server";

import { revisarAlertasDe } from "@/lib/alertasServidor";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY" }, { status: 503 });
  }

  const [perfiles, prospectos] = await Promise.all([
    admin.from("perfiles_asesor").select("asesor_id"),
    admin.from("prospectos").select("asesor_id"),
  ]);
  if (perfiles.error) return NextResponse.json({ error: perfiles.error.message }, { status: 500 });
  if (prospectos.error) return NextResponse.json({ error: prospectos.error.message }, { status: 500 });

  const asesores = new Set<string>();
  for (const fila of perfiles.data ?? []) asesores.add(fila.asesor_id);
  for (const fila of prospectos.data ?? []) asesores.add(fila.asesor_id);

  let creadas = 0;
  for (const asesorId of asesores) {
    const nuevas = await revisarAlertasDe(admin, asesorId);
    creadas += nuevas.length;
  }
  return NextResponse.json({ asesores: asesores.size, creadas });
}
