import { describe, expect, it } from "vitest";

import { TABLA_FACTORES } from "@/config/isapres";

import { construirCoberturas, evaluarCotizacion, type PlanAlternativa } from "./cotizador";

if (!TABLA_FACTORES) throw new Error("TABLA_FACTORES no configurada");
const tabla = TABLA_FACTORES;

const PLAN: PlanAlternativa = {
  id: "p1",
  isapreId: "colmena",
  nombre: "Plan prueba",
  precioBaseUF: 2,
  gesUF: 0.5,
  caecUF: 0.2,
  seguroUF: 0,
};

describe("construirCoberturas", () => {
  it("omite coberturas en 0 y respeta la modalidad", () => {
    const c = construirCoberturas(PLAN);
    expect(c.map((x) => [x.tipo, x.modalidad])).toEqual([
      ["GES", "por_beneficiario"],
      ["CAEC", "por_beneficiario"],
    ]);
  });
});

describe("evaluarCotizacion", () => {
  // Titular 30 años (1,0) + carga 28 (0,7) + carga 5 (0,6) = 2,3
  const base = {
    rentaImponibleCLP: 2_000_000,
    edadTitular: 30,
    edadesCargas: [28, 5],
    valorUF: 40_000,
    topeImponibleUF: 90,
    tabla,
    planes: [PLAN],
  };

  it("resuelve factores con la Tabla Única y calcula cada plan", () => {
    const r = evaluarCotizacion({ ...base, precioPlanActualUF: null });
    expect(r.beneficiarios.map((b) => b.factor)).toEqual([1.0, 0.7, 0.6]);
    expect(r.sumaFactores).toBeCloseTo(2.3, 10);
    expect(r.cotizacionLegal.cotizacionLegalUF).toBeCloseTo(3.5, 10);

    const [p] = r.planes;
    // 2 × 2,3 = 4,6 + GES 0,5 × 3 + CAEC 0,2 × 3 = 6,7
    expect(p.resultado.plan.precioFinalUF).toBeCloseTo(6.7, 10);
    expect(p.resultado.diferencia.tipo).toBe("adicional");
    expect(p.resultado.diferencia.adicionalUF).toBeCloseTo(3.2, 10);
    expect(p.variacionVsActualUF).toBeNull();
    expect(r.planActual).toBeNull();
  });

  it("compara con el plan actual", () => {
    const r = evaluarCotizacion({ ...base, precioPlanActualUF: 7.2 });
    expect(r.planActual?.precioCLP).toBeCloseTo(288_000, 6);
    expect(r.planActual?.diferencia.adicionalUF).toBeCloseTo(3.7, 10);
    expect(r.planes[0].variacionVsActualUF).toBeCloseTo(-0.5, 10);
    expect(r.planes[0].variacionVsActualCLP).toBeCloseTo(-20_000, 6);
  });
});
