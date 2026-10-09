import { GES_UF } from "@/config/isapres";
import type { PlanAlternativa } from "@/lib/calculators/cotizador";
import { parseDecimal, parseEntero } from "@/lib/format";
import type { CargaForm, ClienteForm, PlanForm } from "@/types/cotizador";
import type { IsapreId } from "@/types/isapre";

export const EDAD_MAXIMA = 120;

export interface DatosCotizacion {
  rentaImponibleCLP: number;
  edadTitular: number;
  edadesCargas: number[];
  precioPlanActualUF: number | null;
  planes: PlanAlternativa[];
}

export type LecturaFormulario =
  | { ok: true; datos: DatosCotizacion; planesIncompletos: string[] }
  | { ok: false; faltantes: string[] };

function leerEdad(valor: string): number | null {
  const edad = parseEntero(valor);
  return edad !== null && edad <= EDAD_MAXIMA ? edad : null;
}

function leerMontoOpcional(valor: string): number | null | "invalido" {
  if (valor.trim() === "") return null;
  return parseDecimal(valor) ?? "invalido";
}

export function nombrePlan(plan: PlanForm, indice: number): string {
  return plan.nombre.trim() || `Plan ${indice + 1}`;
}

function leerPlan(
  plan: PlanForm,
  indice: number,
  gesPorIsapre: Partial<Record<IsapreId, number>>,
): PlanAlternativa | string {
  const nombre = nombrePlan(plan, indice);
  const precioBaseUF = parseDecimal(plan.precioBaseUF);
  if (precioBaseUF === null) return `${nombre}: falta el precio base en UF`;

  const seguroUF = leerMontoOpcional(plan.seguroUF);
  if (seguroUF === "invalido") return `${nombre}: revisa el monto de productos adicionales`;

  return {
    id: plan.id,
    isapreId: plan.isapreId,
    nombre,
    precioBaseUF,
    gesUF: plan.isapreId ? (gesPorIsapre[plan.isapreId] ?? GES_UF[plan.isapreId]) : 0,
    seguroUF: seguroUF ?? 0,
  };
}

export function leerFormulario(
  cliente: ClienteForm,
  cargas: CargaForm[],
  planes: PlanForm[],
  gesPorIsapre: Partial<Record<IsapreId, number>> = {},
): LecturaFormulario {
  const faltantes: string[] = [];

  const rentaImponibleCLP = parseEntero(cliente.rentaImponibleCLP);
  if (rentaImponibleCLP === null) faltantes.push("Renta imponible (CLP)");

  const edadTitular = leerEdad(cliente.edadTitular);
  if (edadTitular === null) faltantes.push("Edad del titular");

  const edadesCargas = cargas.map((c) => leerEdad(c.edad));
  edadesCargas.forEach((edad, i) => {
    if (edad === null) faltantes.push(`Edad de la carga ${i + 1}`);
  });

  const precioPlanActual = leerMontoOpcional(cliente.precioPlanActualUF);
  if (precioPlanActual === "invalido") faltantes.push("Precio del plan actual (UF)");

  if (faltantes.length > 0) return { ok: false, faltantes };

  const planesLeidos = planes.map((plan, indice) => leerPlan(plan, indice, gesPorIsapre));

  return {
    ok: true,
    datos: {
      rentaImponibleCLP: rentaImponibleCLP as number,
      edadTitular: edadTitular as number,
      edadesCargas: edadesCargas as number[],
      precioPlanActualUF: precioPlanActual as number | null,
      planes: planesLeidos.filter((p): p is PlanAlternativa => typeof p !== "string"),
    },
    planesIncompletos: planesLeidos.filter((p): p is string => typeof p === "string"),
  };
}
