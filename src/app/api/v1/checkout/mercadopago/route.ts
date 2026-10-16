import { NextResponse } from "next/server";

import { referenciaSuscripcion } from "@/lib/mercadoPago";
import { mercadoPago, urlApp } from "@/lib/mercadoPagoServidor";
import { listarPlanes, obtenerSuscripcion } from "@/lib/supabase/suscripciones";
import { supabaseServer } from "@/lib/supabase/server";
import { inicioCobro, PERIODOS } from "@/lib/suscripcion";

/** Crea la suscripción en Mercado Pago (pendiente) y devuelve el enlace para pagar. El webhook la activa. */
export async function POST(request: Request) {
  const sb = await supabaseServer();
  const { data: usuario } = await sb.auth.getUser();
  const email = usuario.user?.email;
  if (!usuario.user || !email) return NextResponse.json({ error: "Inicia sesión para contratar." }, { status: 401 });

  const mp = mercadoPago();
  if (!mp) return NextResponse.json({ error: "El pago en línea no está configurado." }, { status: 503 });

  const cuerpo = (await request.json().catch(() => null)) as { planId?: unknown; periodo?: unknown } | null;
  const periodo = PERIODOS.find((p) => p.id === cuerpo?.periodo);
  if (!periodo) return NextResponse.json({ error: "Elige mensual, trimestral o anual." }, { status: 400 });

  let precio: number | null;
  let nombrePlan: string;
  let inicio: string | null;
  try {
    const plan = (await listarPlanes(sb)).find((p) => p.id === cuerpo?.planId);
    if (!plan) return NextResponse.json({ error: "Ese plan no existe." }, { status: 400 });
    precio = plan.precios[periodo.id];
    nombrePlan = plan.nombre;
    const lectura = await obtenerSuscripcion(sb);
    inicio = lectura.tablaFalta ? null : inicioCobro(lectura.suscripcion, new Date());
  } catch {
    return NextResponse.json({ error: "No se pudo leer el plan." }, { status: 500 });
  }
  if (precio === null) return NextResponse.json({ error: "Ese período no está disponible para el plan." }, { status: 400 });

  try {
    const suscripcion = await mp.suscripciones.create({
      body: {
        reason: `Velora ${nombrePlan} · ${periodo.nombre}`,
        external_reference: referenciaSuscripcion({ perfilId: usuario.user.id, planId: String(cuerpo?.planId), periodo: periodo.id }),
        payer_email: email,
        back_url: `${urlApp(request)}/suscripcion?pago=retorno`,
        status: "pending",
        auto_recurring: {
          frequency: periodo.meses,
          frequency_type: "months",
          transaction_amount: precio,
          currency_id: "CLP",
          ...(inicio && { start_date: inicio }),
        },
      },
    });
    if (!suscripcion.init_point) throw new Error("Sin init_point");
    return NextResponse.json({ url: suscripcion.init_point });
  } catch (error) {
    console.error("checkout mercadopago", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Mercado Pago no respondió. Intenta de nuevo." }, { status: 502 });
  }
}
