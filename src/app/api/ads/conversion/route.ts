import { NextResponse } from "next/server";

import { adsConfigurado } from "@/lib/cuentaGoogleAds";
import { enviarConversionOffline } from "@/lib/googleAds";
import { obtenerCuentaGoogleAds } from "@/lib/supabase/cuentaGoogleAds";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const sb = await supabaseServer();
  const { data: sesion } = await sb.auth.getClaims();
  if (!sesion?.claims.sub) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const cuerpo = (await request.json().catch(() => null)) as { prospectoId?: unknown } | null;
  const prospectoId = typeof cuerpo?.prospectoId === "string" ? cuerpo.prospectoId : "";
  if (!prospectoId) return NextResponse.json({ enviada: false });

  const { data: prospecto, error } = await sb
    .from("prospectos")
    .select("id, gclid, uf_cierre, ads_conversion_en, etapa_id")
    .eq("id", prospectoId)
    .maybeSingle();
  if (error || !prospecto) return NextResponse.json({ enviada: false });
  if (!prospecto.gclid || prospecto.ads_conversion_en || prospecto.uf_cierre == null) {
    return NextResponse.json({ enviada: false });
  }

  const { data: etapa } = await sb.from("etapas_embudo").select("tipo").eq("id", prospecto.etapa_id).maybeSingle();
  if (etapa?.tipo !== "ganada") return NextResponse.json({ enviada: false });
  const cuenta = await obtenerCuentaGoogleAds(sb).catch(() => null);
  if (!adsConfigurado(cuenta)) return NextResponse.json({ enviada: false, motivo: "sin credenciales" });

  try {
    await enviarConversionOffline(cuenta, {
      gclid: prospecto.gclid,
      uf: Number(prospecto.uf_cierre),
      instante: new Date(),
    });
    await sb
      .from("prospectos")
      .update({ ads_conversion_en: new Date().toISOString(), ads_conversion_error: null })
      .eq("id", prospecto.id);
    return NextResponse.json({ enviada: true });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "No se pudo enviar la conversión";
    await sb.from("prospectos").update({ ads_conversion_error: mensaje.slice(0, 300) }).eq("id", prospecto.id);
    return NextResponse.json({ enviada: false, error: mensaje }, { status: 502 });
  }
}
