export type EstadoSuscripcion = "trialing" | "active" | "past_due" | "canceled";
export type PeriodoPago = "mensual" | "trimestral" | "anual";

export const PERIODOS: { id: PeriodoPago; nombre: string; meses: number }[] = [
  { id: "mensual", nombre: "Mensual", meses: 1 },
  { id: "trimestral", nombre: "Trimestral", meses: 3 },
  { id: "anual", nombre: "Anual", meses: 12 },
];

export interface Suscripcion {
  estado: EstadoSuscripcion;
  planId: string | null;
  periodo: PeriodoPago | null;
  fechaFinTrial: string | null;
  fechaProximoPago: string | null;
}

export type NivelPlan = "basico" | "intermedio" | "full";
export type Funcion = "plan_pdf" | "tarifarios" | "importar" | "leads_web" | "documentos" | "google_ads";

export interface PlanPago {
  id: string;
  nombre: string;
  nivel: NivelPlan | null;
  precios: Record<PeriodoPago, number | null>;
}

export const NIVELES: readonly NivelPlan[] = ["basico", "intermedio", "full"];

/** Debe coincidir con public.plan_permite en Supabase. */
const FUNCIONES_POR_NIVEL: Record<NivelPlan, readonly Funcion[]> = {
  basico: [],
  intermedio: ["plan_pdf", "leads_web", "documentos"],
  full: ["plan_pdf", "tarifarios", "importar", "leads_web", "documentos", "google_ads"],
};

export const NOMBRE_FUNCION: Record<Funcion, string> = {
  plan_pdf: "Carga del plan por PDF",
  tarifarios: "Tarifarios de Isapres",
  importar: "Importar clientes desde Excel",
  leads_web: "Leads de tu sitio web",
  documentos: "Documentos de prospectos",
  google_ads: "Google Ads",
};

export function permite(nivel: NivelPlan, funcion: Funcion): boolean {
  return FUNCIONES_POR_NIVEL[nivel].includes(funcion);
}

export function funcionesDe(nivel: NivelPlan): readonly Funcion[] {
  return FUNCIONES_POR_NIVEL[nivel];
}

/** La prueba gratis (aunque ya haya contratado) y las suscripciones sin plan asignado tienen todo. */
export function nivelEfectivo(s: Suscripcion | null, nivelDelPlan: NivelPlan | null, ahora: Date): NivelPlan {
  if (!s || s.estado === "trialing" || despuesDe(s.fechaFinTrial, ahora) || !s.planId || !nivelDelPlan) return "full";
  return nivelDelPlan;
}

/**
 * Fecha del primer cobro al contratar: al terminar la prueba o el período ya pagado, para no cobrar doble.
 * Null cobra de inmediato.
 */
export function inicioCobro(s: Suscripcion | null, ahora: Date): string | null {
  if (!s) return null;
  if (despuesDe(s.fechaFinTrial, ahora)) return s.fechaFinTrial;
  if ((s.estado === "active" || s.estado === "canceled") && despuesDe(s.fechaProximoPago, ahora)) {
    return s.fechaProximoPago;
  }
  return null;
}

const RUTAS_FUNCION: { prefijo: string; funcion: Funcion }[] = [
  { prefijo: "/documentos", funcion: "documentos" },
  { prefijo: "/google-ads", funcion: "google_ads" },
  { prefijo: "/api/ads", funcion: "google_ads" },
  { prefijo: "/api/tarifarios", funcion: "tarifarios" },
  { prefijo: "/api/cotizador/plan", funcion: "plan_pdf" },
];

export function funcionDeRuta(pathname: string): Funcion | null {
  return RUTAS_FUNCION.find((r) => pathname === r.prefijo || pathname.startsWith(`${r.prefijo}/`))?.funcion ?? null;
}

/** Ahorro del período frente a pagar mes a mes, en % entero. Null si falta un precio o no hay ahorro. */
export function descuentoPeriodo(precios: Record<PeriodoPago, number | null>, periodo: PeriodoPago): number | null {
  const mensual = precios.mensual;
  const precio = precios[periodo];
  const meses = PERIODOS.find((p) => p.id === periodo)?.meses ?? 1;
  if (periodo === "mensual" || mensual === null || precio === null) return null;
  const ahorro = Math.round((1 - precio / (mensual * meses)) * 100);
  return ahorro > 0 ? ahorro : null;
}

export function aNivel(valor: string | null): NivelPlan | null {
  return valor && (NIVELES as readonly string[]).includes(valor) ? (valor as NivelPlan) : null;
}

/** Rutas a las que entra un asesor sin suscripción vigente. */
export const RUTAS_SIN_SUSCRIPCION = ["/suscripcion", "/cuenta/facturacion", "/api/v1/checkout"];

export function rutaSinSuscripcion(pathname: string): boolean {
  return RUTAS_SIN_SUSCRIPCION.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

function despuesDe(iso: string | null, ahora: Date): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  return Number.isFinite(t) && t > ahora.getTime();
}

/**
 * Activa sirve siempre; el trial, hasta su fin; cancelada, hasta el fin del período pagado.
 * Con pago rechazado (past_due) o sin suscripción, no hay acceso.
 */
export function suscripcionVigente(s: Suscripcion | null, ahora: Date): boolean {
  if (!s) return false;
  switch (s.estado) {
    case "active":
      return true;
    case "trialing":
      return despuesDe(s.fechaFinTrial, ahora);
    case "canceled":
      return despuesDe(s.fechaProximoPago, ahora);
    case "past_due":
      return false;
  }
}

/** Días de prueba que quedan, contando un día parcial como entero. Null si no está en trial. */
export function diasRestantesTrial(s: Suscripcion | null, ahora: Date): number | null {
  if (s?.estado !== "trialing" || !s.fechaFinTrial) return null;
  const fin = Date.parse(s.fechaFinTrial);
  if (!Number.isFinite(fin)) return null;
  return Math.max(0, Math.ceil((fin - ahora.getTime()) / 86_400_000));
}

const ESTADOS: readonly string[] = ["trialing", "active", "past_due", "canceled"];
const PERIODOS_ID: readonly string[] = PERIODOS.map((p) => p.id);

export function aSuscripcion(fila: {
  estado: string;
  plan_id: string | null;
  periodo: string | null;
  fecha_fin_trial: string | null;
  fecha_proximo_pago: string | null;
}): Suscripcion | null {
  if (!ESTADOS.includes(fila.estado)) return null;
  return {
    estado: fila.estado as EstadoSuscripcion,
    planId: fila.plan_id,
    periodo: fila.periodo && PERIODOS_ID.includes(fila.periodo) ? (fila.periodo as PeriodoPago) : null,
    fechaFinTrial: fila.fecha_fin_trial,
    fechaProximoPago: fila.fecha_proximo_pago,
  };
}
