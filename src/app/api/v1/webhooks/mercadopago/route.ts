import { InvalidWebhookSignatureError, WebhookSignatureValidator } from "mercadopago";
import { NextResponse } from "next/server";

import { estadoPorPago, estadoPorPreapproval, leerReferencia } from "@/lib/mercadoPago";
import { mercadoPago, type ClientesMercadoPago } from "@/lib/mercadoPagoServidor";
import type { Supabase } from "@/lib/supabase/client";
import { supabaseAdmin } from "@/lib/supabase/server";

class ErrorWebhook extends Error {}

function revisar(error: { message: string } | null, que: string) {
  if (error) throw new ErrorWebhook(`${que}: ${error.message}`);
}

/** Suscripción creada, autorizada, pausada o cancelada en Mercado Pago. */
async function procesarSuscripcion(admin: Supabase, mp: ClientesMercadoPago, id: string): Promise<void> {
  const preapproval = await mp.suscripciones.get({ id });
  const ref = leerReferencia(preapproval.external_reference);
  const estado = estadoPorPreapproval(preapproval.status);
  if (!ref || !estado) return;

  const { data: actual, error } = await admin
    .from("suscripciones")
    .select("mp_preapproval_id")
    .eq("perfil_id", ref.perfilId)
    .maybeSingle();
  revisar(error, "Leer suscripción");
  if (!actual) return;

  if (estado === "active") {
    const { error: errorUpdate } = await admin
      .from("suscripciones")
      .update({
        plan_id: ref.planId,
        periodo: ref.periodo,
        mp_preapproval_id: id,
        estado: "active",
        fecha_proximo_pago: preapproval.next_payment_date ?? null,
      })
      .eq("perfil_id", ref.perfilId);
    revisar(errorUpdate, "Activar suscripción");

    const anterior = actual.mp_preapproval_id;
    if (anterior && anterior !== id) {
      await mp.suscripciones
        .update({ id: anterior, body: { status: "cancelled" } })
        .catch((e: unknown) => console.error("cancelar suscripción anterior", e instanceof Error ? e.message : e));
    }
    return;
  }

  if (actual.mp_preapproval_id !== id) return;
  const { error: errorUpdate } = await admin.from("suscripciones").update({ estado }).eq("perfil_id", ref.perfilId);
  revisar(errorUpdate, "Actualizar suscripción");
}

/** Cobro programado de la suscripción: queda en el historial y define si sigue activa. */
async function procesarCobro(admin: Supabase, mp: ClientesMercadoPago, id: string): Promise<void> {
  const cobro = await mp.cobros.get({ id });
  const preapprovalId = cobro.preapproval_id;
  if (!preapprovalId) return;

  const buscar = () =>
    admin.from("suscripciones").select("perfil_id, estado").eq("mp_preapproval_id", preapprovalId).maybeSingle();
  let { data: suscripcion, error } = await buscar();
  revisar(error, "Buscar suscripción");
  if (!suscripcion) {
    await procesarSuscripcion(admin, mp, preapprovalId);
    ({ data: suscripcion, error } = await buscar());
    revisar(error, "Buscar suscripción");
  }
  if (!suscripcion) return;

  const { error: errorPago } = await admin.from("pagos").upsert(
    {
      perfil_id: suscripcion.perfil_id,
      mp_invoice_id: String(cobro.id ?? id),
      mp_payment_id: cobro.payment?.id ? String(cobro.payment.id) : null,
      mp_preapproval_id: preapprovalId,
      monto_clp: typeof cobro.transaction_amount === "number" ? Math.round(cobro.transaction_amount) : null,
      estado: cobro.payment?.status ?? cobro.status ?? "pending",
      detalle: cobro.reason ?? null,
      fecha: cobro.debit_date ?? cobro.date_created ?? new Date().toISOString(),
    },
    { onConflict: "mp_invoice_id" },
  );
  revisar(errorPago, "Guardar pago");

  const estado = estadoPorPago(cobro.payment?.status);
  if (!estado || suscripcion.estado === "canceled") return;
  const cambios: { estado: typeof estado; fecha_proximo_pago?: string | null } = { estado };
  if (estado === "active") {
    const preapproval = await mp.suscripciones.get({ id: preapprovalId });
    cambios.fecha_proximo_pago = preapproval.next_payment_date ?? null;
  }
  const { error: errorUpdate } = await admin
    .from("suscripciones")
    .update(cambios)
    .eq("perfil_id", suscripcion.perfil_id)
    .eq("mp_preapproval_id", preapprovalId);
  revisar(errorUpdate, "Actualizar suscripción");
}

/** Cambios posteriores de un pago ya registrado (devolución, contracargo). */
async function procesarPago(admin: Supabase, mp: ClientesMercadoPago, id: string): Promise<void> {
  const pago = await mp.pagos.get({ id });
  if (!pago.status) return;
  const { error } = await admin.from("pagos").update({ estado: pago.status }).eq("mp_payment_id", String(id));
  revisar(error, "Actualizar pago");
}

export async function POST(request: Request) {
  const secreto = process.env.MP_WEBHOOK_SECRET?.trim();
  const mp = mercadoPago();
  const admin = supabaseAdmin();
  if (!secreto || !mp || !admin) {
    return NextResponse.json({ error: "Mercado Pago no está configurado." }, { status: 503 });
  }

  const url = new URL(request.url);
  const cuerpo = (await request.json().catch(() => null)) as { type?: unknown; data?: { id?: unknown } } | null;
  const tipo = url.searchParams.get("type") ?? url.searchParams.get("topic") ?? (typeof cuerpo?.type === "string" ? cuerpo.type : "");
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? (cuerpo?.data?.id ? String(cuerpo.data.id) : "");
  if (!dataId) return NextResponse.json({ error: "Falta data.id" }, { status: 400 });

  try {
    WebhookSignatureValidator.validate({
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      dataId,
      secret: secreto,
      toleranceSeconds: 600,
    });
  } catch (error) {
    const motivo = error instanceof InvalidWebhookSignatureError ? error.reason : "desconocido";
    console.error("webhook mercadopago: firma inválida", motivo);
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  try {
    if (tipo === "subscription_preapproval") await procesarSuscripcion(admin, mp, dataId);
    else if (tipo === "subscription_authorized_payment") await procesarCobro(admin, mp, dataId);
    else if (tipo === "payment") await procesarPago(admin, mp, dataId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("webhook mercadopago", tipo, error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "No se pudo procesar la notificación." }, { status: 500 });
  }
}
