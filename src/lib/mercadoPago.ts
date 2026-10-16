import { PERIODOS, type EstadoSuscripcion, type PeriodoPago } from "./suscripcion";

export interface ReferenciaSuscripcion {
  perfilId: string;
  planId: string;
  periodo: PeriodoPago;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** external_reference de la suscripción en Mercado Pago: quién contrata, qué plan y qué período. */
export function referenciaSuscripcion({ perfilId, planId, periodo }: ReferenciaSuscripcion): string {
  return `${perfilId}|${planId}|${periodo}`;
}

export function leerReferencia(valor: string | null | undefined): ReferenciaSuscripcion | null {
  const [perfilId, planId, periodo, ...resto] = (valor ?? "").split("|");
  if (resto.length > 0 || !perfilId || !planId || !UUID_RE.test(perfilId) || !UUID_RE.test(planId)) return null;
  const periodoValido = PERIODOS.find((p) => p.id === periodo)?.id;
  return periodoValido ? { perfilId, planId, periodo: periodoValido } : null;
}

/** Estado de la suscripción en Mercado Pago → estado en Velora. Null: no cambia nada. */
export function estadoPorPreapproval(status: string | undefined): EstadoSuscripcion | null {
  switch (status) {
    case "authorized":
      return "active";
    case "paused":
      return "past_due";
    case "cancelled":
      return "canceled";
    default:
      return null;
  }
}

/** Resultado de un cobro de la suscripción → estado en Velora. Null: pendiente, no cambia nada. */
export function estadoPorPago(status: string | undefined): EstadoSuscripcion | null {
  switch (status) {
    case "approved":
      return "active";
    case "rejected":
    case "cancelled":
      return "past_due";
    default:
      return null;
  }
}

export const ESTADO_PAGO: Record<string, string> = {
  approved: "Aprobado",
  rejected: "Rechazado",
  pending: "Pendiente",
  in_process: "En proceso",
  cancelled: "Cancelado",
  refunded: "Devuelto",
  charged_back: "Contracargo",
  scheduled: "Programado",
};
