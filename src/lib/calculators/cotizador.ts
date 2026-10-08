import type {
  Beneficiario,
  CoberturaAdicional,
  IsapreId,
  ResultadoCotizacion,
  ResultadoCotizacionLegal,
  ResultadoDiferencia,
  TablaFactores,
} from "@/types/isapre";

import { resolverBeneficiarios } from "./factores";
import { calcularCotizacionLegal, calcularDiferencia, cotizar, ufACLP } from "./isapreMath";

export interface PlanAlternativa {
  id: string;
  isapreId: IsapreId | null;
  nombre: string;
  precioBaseUF: number;
  /** UF por beneficiario. */
  gesUF: number;
  /** UF por beneficiario. */
  caecUF: number;
  /** UF por contrato. */
  seguroUF: number;
}

export function construirCoberturas(plan: PlanAlternativa): CoberturaAdicional[] {
  const coberturas: CoberturaAdicional[] = [
    { id: "ges", tipo: "GES", nombre: "GES", precioUF: plan.gesUF, modalidad: "por_beneficiario" },
    { id: "caec", tipo: "CAEC", nombre: "CAEC", precioUF: plan.caecUF, modalidad: "por_beneficiario" },
    {
      id: "seguro",
      tipo: "SEGURO",
      nombre: "Seguros adicionales",
      precioUF: plan.seguroUF,
      modalidad: "por_contrato",
    },
  ];
  return coberturas.filter((c) => c.precioUF > 0);
}

export interface EntradaEvaluacion {
  rentaImponibleCLP: number;
  edadTitular: number;
  edadesCargas: number[];
  precioPlanActualUF: number | null;
  planes: PlanAlternativa[];
  valorUF: number;
  topeImponibleUF: number;
  tabla: TablaFactores;
}

export interface ResultadoPlanActual {
  precioUF: number;
  precioCLP: number;
  diferencia: ResultadoDiferencia;
}

export interface ResultadoPlanAlternativa {
  plan: PlanAlternativa;
  resultado: ResultadoCotizacion;
  /** Precio propuesta − precio actual. Negativo = el cliente paga menos. `null` sin plan actual. */
  variacionVsActualUF: number | null;
  variacionVsActualCLP: number | null;
}

export interface ResultadoEvaluacion {
  beneficiarios: Beneficiario[];
  sumaFactores: number;
  cotizacionLegal: ResultadoCotizacionLegal;
  planActual: ResultadoPlanActual | null;
  planes: ResultadoPlanAlternativa[];
}

export function evaluarCotizacion(entrada: EntradaEvaluacion): ResultadoEvaluacion {
  const { valorUF, topeImponibleUF, precioPlanActualUF } = entrada;

  const beneficiarios = resolverBeneficiarios(entrada.tabla, {
    edadTitular: entrada.edadTitular,
    cargas: entrada.edadesCargas.map((edad, i) => ({ id: `carga-${i}`, edad })),
  });
  const factores = beneficiarios.map((b) => b.factor);

  const cotizacionLegal = calcularCotizacionLegal({
    rentaImponibleCLP: entrada.rentaImponibleCLP,
    valorUF,
    topeImponibleUF,
  });

  const planActual =
    precioPlanActualUF === null
      ? null
      : {
          precioUF: precioPlanActualUF,
          precioCLP: ufACLP(precioPlanActualUF, valorUF),
          diferencia: calcularDiferencia(
            cotizacionLegal.cotizacionLegalUF,
            precioPlanActualUF,
            valorUF,
          ),
        };

  const planes = entrada.planes.map((plan) => {
    const resultado = cotizar({
      rentaImponibleCLP: entrada.rentaImponibleCLP,
      valorUF,
      topeImponibleUF,
      precioBaseUF: plan.precioBaseUF,
      factores,
      coberturas: construirCoberturas(plan),
    });
    const variacionVsActualUF = planActual
      ? resultado.plan.precioFinalUF - planActual.precioUF
      : null;
    return {
      plan,
      resultado,
      variacionVsActualUF,
      variacionVsActualCLP:
        variacionVsActualUF === null ? null : ufACLP(variacionVsActualUF, valorUF),
    };
  });

  return {
    beneficiarios,
    sumaFactores: factores.reduce((acc, f) => acc + f, 0),
    cotizacionLegal,
    planActual,
    planes,
  };
}
