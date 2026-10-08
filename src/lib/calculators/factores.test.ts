import { describe, expect, it } from "vitest";

import type { TablaFactores } from "@/types/isapre";

import { resolverBeneficiarios, resolverFactor } from "./factores";

// Valores ficticios solo para pruebas; no corresponden a la tabla oficial.
const TABLA: TablaFactores = {
  id: "test",
  nombre: "Tabla de prueba",
  tramos: [
    { edadDesde: 0, edadHasta: 20, factores: { titular: 0.6, carga: 0.6 } },
    { edadDesde: 20, edadHasta: 60, factores: { titular: 1, carga: 0.7 } },
    { edadDesde: 60, edadHasta: null, factores: { titular: 2, carga: 2 } },
  ],
};

describe("resolverFactor", () => {
  it("usa límite inferior inclusivo y superior exclusivo", () => {
    expect(resolverFactor(TABLA, "titular", 19)).toBe(0.6);
    expect(resolverFactor(TABLA, "titular", 20)).toBe(1);
    expect(resolverFactor(TABLA, "carga", 59)).toBe(0.7);
    expect(resolverFactor(TABLA, "carga", 60)).toBe(2);
  });

  it("el último tramo es abierto", () => {
    expect(resolverFactor(TABLA, "titular", 95)).toBe(2);
  });

  it("rechaza edades inválidas o sin tramo", () => {
    expect(() => resolverFactor(TABLA, "titular", -1)).toThrow(RangeError);
    expect(() => resolverFactor(TABLA, "titular", 30.5)).toThrow(RangeError);
    const incompleta: TablaFactores = { ...TABLA, tramos: TABLA.tramos.slice(1) };
    expect(() => resolverFactor(incompleta, "carga", 5)).toThrow(RangeError);
  });
});

describe("resolverBeneficiarios", () => {
  it("resuelve titular y cargas desde la tabla", () => {
    const r = resolverBeneficiarios(TABLA, {
      edadTitular: 35,
      cargas: [
        { id: "c1", edad: 33 },
        { id: "c2", edad: 5 },
      ],
    });
    expect(r.map((b) => [b.rol, b.factor])).toEqual([
      ["titular", 1],
      ["carga", 0.7],
      ["carga", 0.6],
    ]);
  });

  it("el factor manual tiene prioridad sobre la tabla", () => {
    const r = resolverBeneficiarios(TABLA, {
      edadTitular: 35,
      factorManualTitular: 1.3,
      cargas: [{ id: "c1", edad: 5, factorManual: 0.4 }],
    });
    expect(r.map((b) => b.factor)).toEqual([1.3, 0.4]);
  });

  it("sin tabla funciona solo con factores manuales", () => {
    expect(
      resolverBeneficiarios(null, { edadTitular: 35, factorManualTitular: 1, cargas: [] }),
    ).toHaveLength(1);
    expect(() =>
      resolverBeneficiarios(null, { edadTitular: 35, cargas: [] }),
    ).toThrow(/Tabla de Factores/);
  });
});
