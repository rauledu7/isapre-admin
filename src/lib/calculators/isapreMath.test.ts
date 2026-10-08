import { describe, expect, it } from "vitest";

import type { CoberturaAdicional } from "@/types/isapre";

import {
  calcularCotizacionLegal,
  calcularDiferencia,
  calcularPrecioPlan,
  clpAUF,
  cotizar,
  redondearCLP,
  redondearUF,
  ufACLP,
} from "./isapreMath";

const VALOR_UF = 40_000;
const TOPE_UF = 90;

const GES: CoberturaAdicional = {
  id: "ges",
  tipo: "GES",
  nombre: "GES",
  precioUF: 0.5,
  modalidad: "por_beneficiario",
};
const CAEC: CoberturaAdicional = {
  id: "caec",
  tipo: "CAEC",
  nombre: "CAEC",
  precioUF: 0.2,
  modalidad: "por_beneficiario",
};
const SEGURO: CoberturaAdicional = {
  id: "seguro",
  tipo: "SEGURO",
  nombre: "Seguro complementario",
  precioUF: 0.3,
  modalidad: "por_contrato",
};

describe("conversión UF/CLP", () => {
  it("convierte en ambos sentidos", () => {
    expect(clpAUF(1_000_000, VALOR_UF)).toBe(25);
    expect(ufACLP(25, VALOR_UF)).toBe(1_000_000);
  });

  it("rechaza valor UF no positivo", () => {
    expect(() => clpAUF(1, 0)).toThrow(RangeError);
    expect(() => ufACLP(1, -1)).toThrow(RangeError);
  });

  it("redondea UF a 4 decimales y CLP a entero", () => {
    expect(redondearUF(1.23456)).toBe(1.2346);
    expect(redondearUF(1.005)).toBe(1.005);
    expect(redondearCLP(1234.5)).toBe(1235);
  });
});

describe("calcularCotizacionLegal", () => {
  it("aplica 7% sobre la renta bajo el tope", () => {
    const r = calcularCotizacionLegal({
      rentaImponibleCLP: 2_000_000,
      valorUF: VALOR_UF,
      topeImponibleUF: TOPE_UF,
    });
    expect(r.aplicaTope).toBe(false);
    expect(r.rentaImponibleUF).toBe(50);
    expect(r.rentaTopadaUF).toBe(50);
    expect(r.cotizacionLegalUF).toBeCloseTo(3.5, 10);
    expect(r.cotizacionLegalCLP).toBeCloseTo(140_000, 6);
  });

  it("limita al tope imponible", () => {
    const r = calcularCotizacionLegal({
      rentaImponibleCLP: 5_000_000,
      valorUF: VALOR_UF,
      topeImponibleUF: TOPE_UF,
    });
    expect(r.aplicaTope).toBe(true);
    expect(r.rentaImponibleUF).toBe(125);
    expect(r.rentaTopadaUF).toBe(90);
    expect(r.rentaTopadaCLP).toBe(3_600_000);
    expect(r.cotizacionLegalUF).toBeCloseTo(6.3, 10);
    expect(r.cotizacionLegalCLP).toBeCloseTo(252_000, 6);
  });

  it("renta exactamente en el tope no marca aplicaTope", () => {
    const r = calcularCotizacionLegal({
      rentaImponibleCLP: TOPE_UF * VALOR_UF,
      valorUF: VALOR_UF,
      topeImponibleUF: TOPE_UF,
    });
    expect(r.aplicaTope).toBe(false);
    expect(r.cotizacionLegalUF).toBeCloseTo(6.3, 10);
  });

  it("rechaza renta negativa o tope inválido", () => {
    const base = { valorUF: VALOR_UF, topeImponibleUF: TOPE_UF };
    expect(() =>
      calcularCotizacionLegal({ ...base, rentaImponibleCLP: -1 }),
    ).toThrow(RangeError);
    expect(() =>
      calcularCotizacionLegal({
        ...base,
        rentaImponibleCLP: 1,
        topeImponibleUF: 0,
      }),
    ).toThrow(RangeError);
  });
});

describe("calcularPrecioPlan", () => {
  it("multiplica precio base por suma de factores y suma coberturas", () => {
    const r = calcularPrecioPlan({
      precioBaseUF: 2,
      factores: [1, 0.5, 0.5],
      coberturas: [GES, CAEC, SEGURO],
      valorUF: VALOR_UF,
    });
    expect(r.sumaFactores).toBe(2);
    expect(r.precioBaseAjustadoUF).toBe(4);

    const [ges, caec, seguro] = r.coberturas;
    expect(ges.cantidad).toBe(3);
    expect(ges.totalUF).toBeCloseTo(1.5, 10);
    expect(caec.cantidad).toBe(3);
    expect(caec.totalUF).toBeCloseTo(0.6, 10);
    expect(seguro.cantidad).toBe(1);
    expect(seguro.totalUF).toBeCloseTo(0.3, 10);

    expect(r.totalCoberturasUF).toBeCloseTo(2.4, 10);
    expect(r.precioFinalUF).toBeCloseTo(6.4, 10);
    expect(r.precioFinalCLP).toBeCloseTo(256_000, 6);
  });

  it("exige al menos un beneficiario", () => {
    expect(() =>
      calcularPrecioPlan({
        precioBaseUF: 2,
        factores: [],
        coberturas: [],
        valorUF: VALOR_UF,
      }),
    ).toThrow(RangeError);
  });

  it("rechaza factores negativos", () => {
    expect(() =>
      calcularPrecioPlan({
        precioBaseUF: 2,
        factores: [1, -0.5],
        coberturas: [],
        valorUF: VALOR_UF,
      }),
    ).toThrow(RangeError);
  });
});

describe("calcularDiferencia", () => {
  it("diferencia positiva genera excedente", () => {
    const r = calcularDiferencia(5, 4, VALOR_UF);
    expect(r.tipo).toBe("excedente");
    expect(r.excedenteUF).toBe(1);
    expect(r.excedenteCLP).toBe(40_000);
    expect(r.adicionalUF).toBe(0);
  });

  it("diferencia negativa requiere cotización adicional", () => {
    const r = calcularDiferencia(3.5, 4.25, VALOR_UF);
    expect(r.tipo).toBe("adicional");
    expect(r.diferenciaUF).toBeCloseTo(-0.75, 10);
    expect(r.adicionalUF).toBeCloseTo(0.75, 10);
    expect(r.adicionalCLP).toBeCloseTo(30_000, 6);
    expect(r.excedenteUF).toBe(0);
  });

  it("diferencia bajo la precisión de 4 decimales es sin diferencia", () => {
    const r = calcularDiferencia(4.00001, 4, VALOR_UF);
    expect(r.tipo).toBe("sin_diferencia");
    expect(r.excedenteUF).toBe(0);
    expect(r.adicionalUF).toBe(0);
  });
});

describe("cotizar", () => {
  it("integra 7% legal, precio del plan y diferencia", () => {
    const r = cotizar({
      rentaImponibleCLP: 2_000_000,
      valorUF: VALOR_UF,
      topeImponibleUF: TOPE_UF,
      precioBaseUF: 2,
      factores: [1, 0.5, 0.5],
      coberturas: [GES, CAEC, SEGURO],
    });
    expect(r.cotizacionLegal.cotizacionLegalUF).toBeCloseTo(3.5, 10);
    expect(r.plan.precioFinalUF).toBeCloseTo(6.4, 10);
    expect(r.diferencia.tipo).toBe("adicional");
    expect(r.diferencia.adicionalUF).toBeCloseTo(2.9, 10);
    expect(r.diferencia.adicionalCLP).toBeCloseTo(116_000, 6);
  });
});
