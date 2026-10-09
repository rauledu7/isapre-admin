import { NextResponse } from "next/server";

import { adsConfigurado } from "@/lib/cuentaGoogleAds";
import { fechaHoy } from "@/lib/fecha";
import { rangoMetricasAds, resumenCuentaAds } from "@/lib/googleAds";
import { obtenerCuentaGoogleAds } from "@/lib/supabase/cuentaGoogleAds";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getClaims();
  if (!data?.claims.sub) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const url = new URL(request.url);
  const rango = rangoMetricasAds(url.searchParams.get("desde"), url.searchParams.get("hasta"), fechaHoy(new Date()));
  if ("error" in rango) return NextResponse.json({ error: rango.error }, { status: 400 });

  try {
    const cuenta = await obtenerCuentaGoogleAds(sb);
    if (!adsConfigurado(cuenta)) {
      return NextResponse.json({ conectado: false, desde: rango.desde, hasta: rango.hasta });
    }
    const resumen = await resumenCuentaAds(cuenta, rango.desde, rango.hasta);
    return NextResponse.json({ conectado: true, desde: rango.desde, hasta: rango.hasta, resumen });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "No se pudo leer Google Ads";
    return NextResponse.json({ conectado: true, desde: rango.desde, hasta: rango.hasta, error: mensaje });
  }
}
