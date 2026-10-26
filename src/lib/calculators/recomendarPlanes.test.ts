import { describe, expect, it } from "vitest";

import { TABLA_FACTORES } from "@/config/isapres";

import { recomendarParaProspecto, recomendarPlanes, type CandidatoRecomendacion } from "./recomendarPlanes";

if (!TABLA_FACTORES) throw new Error("TABLA_FACTORES no configurada");
const tabla = TABLA_FACTORES;

const VALOR_UF = 40_000;

function plan(
  codigo: string,
  precioBaseUF: number,
  gesUF = 0,
  isapreId: CandidatoRecomendacion["isapreId"] = "vida-tres",
): CandidatoRecomendacion {
  return { isapreId, codigo, linea: codigo, precioBaseUF, gesUF };
}

describe("recomendarPlanes", () => {
  it("elige el más cercano aunque se pase del 7%", () => {
    const elegidos = recomendarPlanes({
      cotizacionLegalUF: 3.5,
      factores: [1],
      valorUF: VALOR_UF,
      cantidad: 1,
      candidatos: [plan("LEJOS", 2), plan("CERCA", 2.9, 0.712), plan("MEDIO", 2.5, 0.712)],
    });

    expect(elegidos.map((item) => item.codigo)).toEqual(["CERCA"]);
    expect(elegidos[0]?.precioFinalUF).toBeCloseTo(3.612, 4);
  });

  it("elige los dos más cercanos, uno por debajo y otro por encima", () => {
    const elegidos = recomendarPlanes({
      cotizacionLegalUF: 3.5,
      factores: [1],
      valorUF: VALOR_UF,
      cantidad: 2,
      candidatos: [plan("LEJOS", 2, 0.712), plan("ARRIBA", 2.9, 0.712), plan("ABAJO", 2.5, 0.712)],
    });

    expect(elegidos.map((item) => item.codigo)).toEqual(["ARRIBA", "ABAJO"]);
  });

  it("si quedan a la misma distancia, prefiere el que cabe en el 7%", () => {
    const elegidos = recomendarPlanes({
      cotizacionLegalUF: 3,
      factores: [1],
      valorUF: VALOR_UF,
      cantidad: 1,
      candidatos: [plan("ARRIBA", 3.2), plan("ABAJO", 2.8)],
    });

    expect(elegidos.map((item) => item.codigo)).toEqual(["ABAJO"]);
  });

  it("no repite el mismo código de una Isapre y descarta bases inválidas", () => {
    const elegidos = recomendarPlanes({
      cotizacionLegalUF: 2,
      factores: [1],
      valorUF: VALOR_UF,
      cantidad: 2,
      candidatos: [plan("A", 2, 0, "banmedica"), plan("A", 1, 0, "banmedica"), plan("A", 2, 0, "colmena"), plan("MAL", 0)],
    });

    expect(elegidos.map((item) => `${item.isapreId}:${item.codigo}`)).toEqual(["banmedica:A", "colmena:A"]);
  });

  it("no recomienda si no hay cupos o beneficiarios", () => {
    const candidatos = [plan("A", 2)];
    expect(
      recomendarPlanes({ cotizacionLegalUF: 2, factores: [1], valorUF: VALOR_UF, cantidad: 0, candidatos }),
    ).toEqual([]);
    expect(
      recomendarPlanes({ cotizacionLegalUF: 2, factores: [], valorUF: VALOR_UF, cantidad: 1, candidatos }),
    ).toEqual([]);
  });
});

describe("recomendarParaProspecto", () => {
  it("usa el 7% de la renta y el factor del titular", () => {
    const resultado = recomendarParaProspecto({
      rentaImponibleCLP: 2_000_000,
      edadTitular: 30,
      edadesCargas: [],
      valorUF: VALOR_UF,
      topeImponibleUF: 90,
      tabla,
      cantidad: 1,
      candidatos: [plan("CERCA", 2.9, 0.712), plan("LEJOS", 1, 0.712)],
    });

    expect(resultado.cotizacionLegalUF).toBeCloseTo(3.5, 4);
    expect(resultado.planes.map((item) => item.codigo)).toEqual(["CERCA"]);
  });
});
