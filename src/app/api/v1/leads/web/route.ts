import { NextResponse } from "next/server";

import { leerLead } from "@/lib/adquisicion";
import { detalleFormularioWeb, mismoSitio, normalizarSitio, notaLeadWeb } from "@/lib/sitioWeb";
import { supabaseAdmin } from "@/lib/supabase/server";

function cors(origen: string): Headers {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", origen);
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Vary", "Origin");
  return headers;
}

function responder(origen: string | null, body: unknown, status: number) {
  const headers = origen && normalizarSitio(origen) ? cors(origen) : undefined;
  return NextResponse.json(body, { status, headers });
}

/** Preflight del formulario en la página del asesor. */
export async function OPTIONS(request: Request) {
  const origen = request.headers.get("origin");
  const sitio = await sitioDelOrigen(origen);
  if (!sitio || !origen) return new NextResponse(null, { status: 403 });
  return new NextResponse(null, { status: 204, headers: cors(origen) });
}

async function sitioDelOrigen(origen: string | null): Promise<string | null> {
  const sitio = normalizarSitio(origen ?? "");
  if (!sitio) return null;
  const admin = supabaseAdmin();
  if (!admin) return null;
  const { data } = await admin.from("perfiles_asesor").select("sitio_web").eq("sitio_web", sitio).maybeSingle();
  return data?.sitio_web && mismoSitio(origen, data.sitio_web) ? data.sitio_web : null;
}

export async function POST(request: Request) {
  const origen = request.headers.get("origin");
  const sitio = normalizarSitio(origen ?? "");
  if (!origen || !sitio) return responder(origen, { error: "Falta la página de origen." }, 403);

  const admin = supabaseAdmin();
  if (!admin) return responder(origen, { error: "Falta SUPABASE_SERVICE_ROLE_KEY" }, 503);

  const { data: perfil, error: errorPerfil } = await admin
    .from("perfiles_asesor")
    .select("asesor_id, sitio_web")
    .eq("sitio_web", sitio)
    .maybeSingle();
  if (errorPerfil) return responder(origen, { error: "No se pudo verificar la página." }, 500);
  if (!perfil || !mismoSitio(origen, perfil.sitio_web ?? "")) {
    return responder(origen, { error: "Esta página no está vinculada a un asesor." }, 403);
  }

  const body = await request.json().catch(() => null);
  const lectura = leerLead(body);
  if (!lectura.ok) return responder(origen, { errores: lectura.errores }, 422);

  const { data: etapas, error: errorEtapas } = await admin
    .from("etapas_embudo")
    .select("id")
    .eq("asesor_id", perfil.asesor_id)
    .eq("tipo", "abierta")
    .order("orden")
    .limit(1);
  const etapa = etapas?.[0];
  if (errorEtapas || !etapa) {
    return responder(origen, { error: "El asesor no tiene una etapa abierta en el embudo." }, 409);
  }

  const lead = lectura.datos;
  const detalle = detalleFormularioWeb(body);
  const { data, error } = await admin
    .from("prospectos")
    .insert({
      asesor_id: perfil.asesor_id,
      etapa_id: etapa.id,
      nombre: lead.nombre,
      rut: lead.rut,
      telefono: lead.telefono,
      email: lead.email,
      origen: "web",
      utm_source: lead.utmSource ?? new URL(sitio).hostname,
      utm_campaign: lead.utmCampaign,
      utm_kw: lead.utmKw,
      gclid: lead.gclid,
    })
    .select("id")
    .single();

  if (error?.code === "23505") {
    return responder(origen, { error: "Ya existe un prospecto con ese RUT." }, 409);
  }
  if (error || !data) {
    return responder(origen, { error: error?.message ?? "No se pudo crear el prospecto" }, 500);
  }

  const { error: errorNota } = await admin.from("notas_prospecto").insert({
    asesor_id: perfil.asesor_id,
    prospecto_id: data.id,
    contenido: notaLeadWeb({ sitio, renta: detalle.renta, cargas: detalle.cargas }),
  });
  if (errorNota) {
    await admin.from("prospectos").delete().eq("id", data.id);
    return responder(origen, { error: "No se pudo guardar la nota del contacto." }, 500);
  }

  return responder(origen, { id: data.id }, 201);
}
