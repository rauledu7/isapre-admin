import { NextResponse } from "next/server";

import { formularioDesde, fusionarCuenta, vistaCuenta } from "@/lib/cuentaGoogleAds";
import { guardarCuentaGoogleAds, obtenerCuentaGoogleAds } from "@/lib/supabase/cuentaGoogleAds";
import { supabaseServer } from "@/lib/supabase/server";

async function sesion() {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getClaims();
  const asesorId = data?.claims.sub;
  if (!asesorId) return null;
  return { sb, asesorId };
}

export async function GET() {
  const actual = await sesion();
  if (!actual) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const cuenta = await obtenerCuentaGoogleAds(actual.sb);
    return NextResponse.json(vistaCuenta(cuenta));
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "No se pudo leer la cuenta";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const actual = await sesion();
  if (!actual) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let anterior = null;
  try {
    anterior = await obtenerCuentaGoogleAds(actual.sb);
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "No se pudo leer la cuenta";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }

  const fusion = fusionarCuenta(anterior, formularioDesde(await request.json().catch(() => null)));
  if (!fusion.ok) return NextResponse.json({ errores: fusion.errores }, { status: 422 });

  try {
    await guardarCuentaGoogleAds(actual.sb, actual.asesorId, fusion.cuenta);
    return NextResponse.json(vistaCuenta(fusion.cuenta));
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "No se pudo guardar la cuenta";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
