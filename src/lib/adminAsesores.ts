import { fechaISO } from "./fecha";
import { suscripcionVigente, type Suscripcion } from "./suscripcion";

export type CategoriaAsesor =
  | "trial"
  | "pagado"
  | "cortesia"
  | "pendiente"
  | "cancelado"
  | "vencido"
  | "bloqueado"
  | "sin_suscripcion";

export const NOMBRE_CATEGORIA: Record<CategoriaAsesor, string> = {
  trial: "En prueba",
  pagado: "Pagado",
  cortesia: "Activo sin cobro",
  pendiente: "Pago pendiente",
  cancelado: "Cancelado con acceso",
  vencido: "Vencido",
  bloqueado: "Bloqueado",
  sin_suscripcion: "Sin suscripción",
};

export interface AsesorAdmin {
  id: string;
  email: string | null;
  nombre: string | null;
  creadoEn: string;
  ultimoIngreso: string | null;
  suscripcion: Suscripcion | null;
  planNombre: string | null;
}

export interface PagoAdmin {
  montoCLP: number | null;
  estado: string;
  fecha: string;
}

export interface MetricasAdmin {
  total: number;
  enTrial: number;
  pagados: number;
  cortesia: number;
  pendientes: number;
  bloqueados: number;
  ingresosTotalCLP: number;
  ingresosMesCLP: number;
}

/** Pagado = tiene plan contratado y activo (aunque el primer cobro sea al terminar la prueba). */
export function categoriaAsesor(s: Suscripcion | null, ahora: Date): CategoriaAsesor {
  if (!s) return "sin_suscripcion";
  if (s.bloqueado) return "bloqueado";
  const vigente = suscripcionVigente(s, ahora);
  switch (s.estado) {
    case "trialing":
      return vigente ? "trial" : "vencido";
    case "active":
      return s.planId ? "pagado" : "cortesia";
    case "past_due":
      return "pendiente";
    case "canceled":
      return vigente ? "cancelado" : "vencido";
  }
}

export function metricasAdmin(asesores: AsesorAdmin[], pagos: PagoAdmin[], ahora: Date): MetricasAdmin {
  const contar = (categoria: CategoriaAsesor) =>
    asesores.filter((a) => categoriaAsesor(a.suscripcion, ahora) === categoria).length;
  const mes = fechaISO(ahora).slice(0, 7);
  const aprobados = pagos.filter((p) => p.estado === "approved" && p.montoCLP !== null);
  const sumar = (lista: PagoAdmin[]) => lista.reduce((total, p) => total + (p.montoCLP ?? 0), 0);
  return {
    total: asesores.length,
    enTrial: contar("trial"),
    pagados: contar("pagado"),
    cortesia: contar("cortesia"),
    pendientes: contar("pendiente"),
    bloqueados: contar("bloqueado"),
    ingresosTotalCLP: sumar(aprobados),
    ingresosMesCLP: sumar(aprobados.filter((p) => fechaISO(new Date(p.fecha)).slice(0, 7) === mes)),
  };
}

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function filtrarAsesores(asesores: AsesorAdmin[], busqueda: string): AsesorAdmin[] {
  const q = normalizar(busqueda);
  if (!q) return asesores;
  return asesores.filter((a) => normalizar(`${a.email ?? ""} ${a.nombre ?? ""}`).includes(q));
}

/** Suma 7 días al trial desde hoy o desde su fin, lo que sea más tarde. */
export function finTrialExtendido(finActual: string | null, ahora: Date, dias = 7): string {
  const fin = finActual ? Date.parse(finActual) : Number.NaN;
  const base = Number.isFinite(fin) && fin > ahora.getTime() ? fin : ahora.getTime();
  return new Date(base + dias * 86_400_000).toISOString();
}
