import type { NivelPlan, PeriodoPago } from "@/lib/suscripcion";

/** Precios de referencia. Deben coincidir con las filas de public.planes. */
export interface PlanPublico {
  /** Identificador de public.planes.nivel. */
  nivel: NivelPlan;
  /** Nombre en la URL de registro. */
  slug: string;
  nombre: string;
  linea: string;
  mensual: number;
  trimestral: number;
  anual: number;
  incluye: string[];
  destacado?: boolean;
}

export const PLANES_PUBLICOS: PlanPublico[] = [
  {
    nivel: "basico",
    slug: "basico",
    nombre: "Básico",
    linea: "La reunión",
    mensual: 14990,
    trimestral: 39990,
    anual: 143990,
    incluye: [
      "Calculas el 7% legal y lo ves junto al plan que el cliente ya tiene",
      "Sigues la meta del mes en UF cerradas y en contratos",
      "Anotas la cita con el día, la hora, el nombre y una nota",
    ],
  },
  {
    nivel: "intermedio",
    slug: "profesional",
    nombre: "Profesional",
    linea: "El seguimiento",
    mensual: 29990,
    trimestral: 80990,
    anual: 287990,
    destacado: true,
    incluye: [
      "Todo lo del Básico",
      "Comparas la cotización con un plan más",
      "Envías la propuesta por WhatsApp o en PDF",
      "Guardas prospectos, cotizaciones, notas y el próximo contacto",
    ],
  },
  {
    nivel: "full",
    slug: "full",
    nombre: "Full",
    linea: "La cartera",
    mensual: 39990,
    trimestral: 107990,
    anual: 383990,
    incluye: [
      "Todo lo del Profesional",
      "Comparas la cotización con dos planes más, y el GES sale de la Isapre que elegiste",
      "Velora lee el PDF del plan, los documentos del cliente y los tarifarios",
      "Llevas el embudo, importas la base, armas las etapas y ves Google Ads",
    ],
  },
];

export function planPublico(clave: string | null): PlanPublico | null {
  if (!clave) return null;
  return PLANES_PUBLICOS.find((plan) => plan.slug === clave || plan.nivel === clave) ?? null;
}

export function precioPublico(plan: PlanPublico, periodo: PeriodoPago): number {
  return plan[periodo];
}
