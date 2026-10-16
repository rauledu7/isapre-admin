import "server-only";

import { Invoice, MercadoPagoConfig, Payment, PreApproval } from "mercadopago";

export interface ClientesMercadoPago {
  suscripciones: PreApproval;
  cobros: Invoice;
  pagos: Payment;
}

/** Null si falta MP_ACCESS_TOKEN. */
export function mercadoPago(): ClientesMercadoPago | null {
  const accessToken = process.env.MP_ACCESS_TOKEN?.trim();
  if (!accessToken) return null;
  const config = new MercadoPagoConfig({ accessToken, options: { timeout: 10_000 } });
  return { suscripciones: new PreApproval(config), cobros: new Invoice(config), pagos: new Payment(config) };
}

/** URL pública de la app para volver desde Mercado Pago. */
export function urlApp(request: Request): string {
  return (process.env.APP_URL?.trim() || new URL(request.url).origin).replace(/\/+$/, "");
}
