import type { TipoEtapa } from "@/types/isapre";

/** Paleta del plan activo. Los mismos hex están en `globals.css`. */
export const PALETA = {
  exito: "#10b981",
  pendiente: "#f59e0b",
  proceso: "#3b82f6",
  prioridad: "#8b5cf6",
  alerta: "#ef4444",
} as const;

/** Etapa abierta = en proceso, ganada = éxito, perdida = alerta. */
export const COLOR_TIPO_ETAPA: Record<TipoEtapa, string> = {
  abierta: PALETA.proceso,
  ganada: PALETA.exito,
  perdida: PALETA.alerta,
};

export const CLASE_PUNTO_ETAPA: Record<TipoEtapa, string> = {
  abierta: "bg-proceso",
  ganada: "bg-exito",
  perdida: "bg-alerta",
};
