import type { IsapreId, TablaFactores } from "@/types/isapre";

import { resolverBeneficiarios } from "./factores";
import { calcularCotizacionLegal, calcularPrecioPlan, redondearUF } from "./isapreMath";

export interface CandidatoRecomendacion {
  isapreId: IsapreId;
  codigo: string;
  linea: string | null;
  precioBaseUF: number;
  /** GES de esa Isapre, en UF por beneficiario. */
  gesUF: number;
}

export interface PlanRecomendado {
  isapreId: IsapreId;
  codigo: string;
  linea: string | null;
  precioBaseUF: number;
  gesUF: number;
  precioFinalUF: number;
  distanciaUF: number;
}

export interface EntradaRecomendacion {
  cotizacionLegalUF: number;
  factores: number[];
  valorUF: number;
  /** 2 en Profesional, 4 en Full. */
  cantidad: number;
  candidatos: CandidatoRecomendacion[];
}

function candidatosUnicos(candidatos: CandidatoRecomendacion[]): CandidatoRecomendacion[] {
  const vistos = new Set<string>();
  const unicos: CandidatoRecomendacion[] = [];
  for (const candidato of candidatos) {
    if (!Number.isFinite(candidato.precioBaseUF) || candidato.precioBaseUF <= 0) continue;
    if (!Number.isFinite(candidato.gesUF) || candidato.gesUF < 0) continue;
    const clave = `${candidato.isapreId}\0${candidato.codigo}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    unicos.push(candidato);
  }
  return unicos;
}

/** Los `cantidad` planes cuyo precio final queda más cerca del 7%, por arriba o por abajo. */
export function recomendarPlanes({
  cotizacionLegalUF,
  factores,
  valorUF,
  cantidad,
  candidatos,
}: EntradaRecomendacion): PlanRecomendado[] {
  if (!Number.isInteger(cantidad) || cantidad < 1 || factores.length === 0) return [];

  const ordenados = candidatosUnicos(candidatos).map((candidato) => {
    const precio = calcularPrecioPlan({
      precioBaseUF: candidato.precioBaseUF,
      factores,
      coberturas:
        candidato.gesUF > 0
          ? [
              {
                id: "ges",
                tipo: "GES",
                nombre: "GES",
                precioUF: candidato.gesUF,
                modalidad: "por_beneficiario",
              },
            ]
          : [],
      valorUF,
    });
    return {
      ...candidato,
      precioFinalUF: precio.precioFinalUF,
      distanciaUF: redondearUF(Math.abs(precio.precioFinalUF - cotizacionLegalUF)),
    };
  });

  ordenados.sort((a, b) => {
    const distancia = a.distanciaUF - b.distanciaUF;
    if (distancia !== 0) return distancia;
    const aCabe = a.precioFinalUF <= cotizacionLegalUF ? 0 : 1;
    const bCabe = b.precioFinalUF <= cotizacionLegalUF ? 0 : 1;
    if (aCabe !== bCabe) return aCabe - bCabe;
    return a.codigo.localeCompare(b.codigo) || a.isapreId.localeCompare(b.isapreId);
  });

  return ordenados.slice(0, cantidad);
}

export interface EntradaProspecto {
  rentaImponibleCLP: number;
  edadTitular: number;
  edadesCargas: number[];
  valorUF: number;
  topeImponibleUF: number;
  tabla: TablaFactores;
  cantidad: number;
  candidatos: CandidatoRecomendacion[];
}

export function recomendarParaProspecto(entrada: EntradaProspecto): {
  cotizacionLegalUF: number;
  planes: PlanRecomendado[];
} {
  const beneficiarios = resolverBeneficiarios(entrada.tabla, {
    edadTitular: entrada.edadTitular,
    cargas: entrada.edadesCargas.map((edad, i) => ({ id: `carga-${i}`, edad })),
  });
  const cotizacionLegal = calcularCotizacionLegal({
    rentaImponibleCLP: entrada.rentaImponibleCLP,
    valorUF: entrada.valorUF,
    topeImponibleUF: entrada.topeImponibleUF,
  });

  return {
    cotizacionLegalUF: cotizacionLegal.cotizacionLegalUF,
    planes: recomendarPlanes({
      cotizacionLegalUF: cotizacionLegal.cotizacionLegalUF,
      factores: beneficiarios.map((beneficiario) => beneficiario.factor),
      valorUF: entrada.valorUF,
      cantidad: entrada.cantidad,
      candidatos: entrada.candidatos,
    }),
  };
}
