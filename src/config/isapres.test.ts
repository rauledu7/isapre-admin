import { describe, expect, it } from "vitest";

import { resolverFactor } from "@/lib/calculators/factores";
import { calcularCotizacionLegal, redondearUF } from "@/lib/calculators/isapreMath";

import { TABLA_FACTORES, TOPE_IMPONIBLE_SALUD_UF } from "./isapres";

describe("Tope imponible de salud", () => {
  it("el 7% máximo coincide con el oficial de la Superintendencia de Salud (6,3 UF)", () => {
    const r = calcularCotizacionLegal({
      rentaImponibleCLP: 10_000_000,
      valorUF: 41_122.74,
      topeImponibleUF: TOPE_IMPONIBLE_SALUD_UF,
    });
    expect(r.aplicaTope).toBe(true);
    expect(redondearUF(r.cotizacionLegalUF)).toBe(6.3);
  });
});

describe("Tabla de Factores Única", () => {
  if (!TABLA_FACTORES) throw new Error("TABLA_FACTORES no configurada");
  const tabla = TABLA_FACTORES;

  it.each([
    [0, 0.6, 0.6],
    [19, 0.6, 0.6],
    [20, 0.9, 0.7],
    [24, 0.9, 0.7],
    [25, 1.0, 0.7],
    [34, 1.0, 0.7],
    [35, 1.3, 0.9],
    [44, 1.3, 0.9],
    [45, 1.4, 1.0],
    [54, 1.4, 1.0],
    [55, 2.0, 1.4],
    [64, 2.0, 1.4],
    [65, 2.4, 2.2],
    [100, 2.4, 2.2],
  ])("edad %i → cotizante %d, carga %d", (edad, titular, carga) => {
    expect(resolverFactor(tabla, "titular", edad)).toBe(titular);
    expect(resolverFactor(tabla, "carga", edad)).toBe(carga);
  });

  it("los tramos son contiguos y sin solapes", () => {
    tabla.tramos.forEach((t, i) => {
      const siguiente = tabla.tramos[i + 1];
      if (siguiente) expect(t.edadHasta).toBe(siguiente.edadDesde);
      else expect(t.edadHasta).toBeNull();
    });
    expect(tabla.tramos[0].edadDesde).toBe(0);
  });
});
