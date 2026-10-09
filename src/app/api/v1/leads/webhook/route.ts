import { NextResponse } from "next/server";

import { leerLead } from "@/lib/adquisicion";
import { fechaHoy } from "@/lib/fecha";
import { supabaseAdmin } from "@/lib/supabase/server";

async function asesorDestino(admin: NonNullable<ReturnType<typeof supabaseAdmin>>): Promise<string | null> {
  const fijo = process.env.LEADS_ASESOR_ID?.trim();
  if (fijo) return fijo;
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 2 });
  if (error || data.users.length !== 1) return null;
  return data.users[0]?.id ?? null;
}

export async function POST(request: Request) {
  const secreto = process.env.LEADS_WEBHOOK_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY" }, { status: 503 });

  const lectura = leerLead(await request.json().catch(() => null));
  if (!lectura.ok) return NextResponse.json({ errores: lectura.errores }, { status: 422 });

  const asesorId = await asesorDestino(admin);
  if (!asesorId) {
    return NextResponse.json({ error: "Define LEADS_ASESOR_ID: hay más de un asesor." }, { status: 409 });
  }

  const { data: etapas, error: errorEtapas } = await admin
    .from("etapas_embudo")
    .select("id, tipo")
    .eq("asesor_id", asesorId)
    .order("orden")
    .limit(1);
  const etapa = etapas?.[0];
  if (errorEtapas || !etapa) {
    return NextResponse.json({ error: "El asesor no tiene etapas en el embudo." }, { status: 409 });
  }

  const lead = lectura.datos;
  const { data, error } = await admin
    .from("prospectos")
    .insert({
      asesor_id: asesorId,
      etapa_id: etapa.id,
      nombre: lead.nombre,
      rut: lead.rut,
      telefono: lead.telefono,
      email: lead.email,
      gclid: lead.gclid,
      utm_source: lead.utmSource,
      utm_campaign: lead.utmCampaign,
      utm_kw: lead.utmKw,
      cerrado_en: etapa.tipo === "ganada" ? fechaHoy(new Date()) : null,
    })
    .select("id")
    .single();

  if (error?.code === "23505") {
    return NextResponse.json({ error: "Ya existe un prospecto con ese RUT." }, { status: 409 });
  }
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "No se pudo crear el prospecto" }, { status: 500 });
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
