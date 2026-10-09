import { NextResponse } from "next/server";

import { adsConfigurado } from "@/lib/cuentaGoogleAds";
import { metricasCampanas } from "@/lib/googleAds";
import { obtenerCuentaGoogleAds } from "@/lib/supabase/cuentaGoogleAds";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getClaims();
  if (!data?.claims.sub) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const cuenta = await obtenerCuentaGoogleAds(sb);
    if (!adsConfigurado(cuenta)) return NextResponse.json({ conectado: false, metricas: [] });
    const metricas = await metricasCampanas(cuenta);
    return NextResponse.json({ conectado: metricas !== null, metricas: metricas ?? [] });
  } catch {
    return NextResponse.json({ conectado: false, metricas: [] });
  }
}
