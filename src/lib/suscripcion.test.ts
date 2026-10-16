import { describe, expect, it } from "vitest";

import {
  aSuscripcion,
  descuentoPeriodo,
  diasRestantesTrial,
  funcionDeRuta,
  nivelEfectivo,
  permite,
  rutaSinSuscripcion,
  suscripcionVigente,
  type Suscripcion,
} from "./suscripcion";

const ahora = new Date("2026-10-16T12:00:00Z");

function sus(parcial: Partial<Suscripcion>): Suscripcion {
  return { estado: "trialing", planId: null, periodo: null, fechaFinTrial: null, fechaProximoPago: null, ...parcial };
}

describe("suscripcionVigente", () => {
  it("sin suscripción no hay acceso", () => {
    expect(suscripcionVigente(null, ahora)).toBe(false);
  });

  it("activa sin fecha de pago sigue vigente", () => {
    expect(suscripcionVigente(sus({ estado: "active" }), ahora)).toBe(true);
  });

  it("trial vigente hasta su fin", () => {
    expect(suscripcionVigente(sus({ fechaFinTrial: "2026-10-16T12:00:01Z" }), ahora)).toBe(true);
    expect(suscripcionVigente(sus({ fechaFinTrial: "2026-10-16T12:00:00Z" }), ahora)).toBe(false);
  });

  it("pago rechazado bloquea", () => {
    expect(suscripcionVigente(sus({ estado: "past_due", fechaProximoPago: "2026-11-01T00:00:00Z" }), ahora)).toBe(false);
  });

  it("cancelada sirve hasta el fin del período pagado", () => {
    expect(suscripcionVigente(sus({ estado: "canceled", fechaProximoPago: "2026-10-20T00:00:00Z" }), ahora)).toBe(true);
    expect(suscripcionVigente(sus({ estado: "canceled", fechaProximoPago: "2026-10-01T00:00:00Z" }), ahora)).toBe(false);
    expect(suscripcionVigente(sus({ estado: "canceled" }), ahora)).toBe(false);
  });
});

describe("diasRestantesTrial", () => {
  it("cuenta el día parcial como entero", () => {
    expect(diasRestantesTrial(sus({ fechaFinTrial: "2026-10-23T12:00:00Z" }), ahora)).toBe(7);
    expect(diasRestantesTrial(sus({ fechaFinTrial: "2026-10-16T13:00:00Z" }), ahora)).toBe(1);
  });

  it("no baja de cero y es null fuera del trial", () => {
    expect(diasRestantesTrial(sus({ fechaFinTrial: "2026-10-10T00:00:00Z" }), ahora)).toBe(0);
    expect(diasRestantesTrial(sus({ estado: "active" }), ahora)).toBeNull();
  });
});

describe("rutaSinSuscripcion", () => {
  it("deja entrar solo a /suscripcion", () => {
    expect(rutaSinSuscripcion("/suscripcion")).toBe(true);
    expect(rutaSinSuscripcion("/suscripcion/pago")).toBe(true);
    expect(rutaSinSuscripcion("/suscripciones")).toBe(false);
    expect(rutaSinSuscripcion("/cotizador")).toBe(false);
  });
});

describe("niveles de plan", () => {
  it("el básico no tiene funciones extra", () => {
    expect(permite("basico", "plan_pdf")).toBe(false);
    expect(permite("basico", "documentos")).toBe(false);
  });

  it("el intermedio suma PDF, leads web y documentos, sin tarifarios, importación ni Google Ads", () => {
    expect(permite("intermedio", "plan_pdf")).toBe(true);
    expect(permite("intermedio", "leads_web")).toBe(true);
    expect(permite("intermedio", "documentos")).toBe(true);
    expect(permite("intermedio", "tarifarios")).toBe(false);
    expect(permite("intermedio", "importar")).toBe(false);
    expect(permite("intermedio", "google_ads")).toBe(false);
  });

  it("el trial y la suscripción sin plan usan el full", () => {
    expect(nivelEfectivo(sus({ fechaFinTrial: "2026-10-20T00:00:00Z", planId: "p" }), "basico")).toBe("full");
    expect(nivelEfectivo(sus({ estado: "active" }), null)).toBe("full");
    expect(nivelEfectivo(sus({ estado: "active", planId: "p" }), "basico")).toBe("basico");
  });

  it("asocia rutas a funciones", () => {
    expect(funcionDeRuta("/documentos")).toBe("documentos");
    expect(funcionDeRuta("/api/ads/metricas")).toBe("google_ads");
    expect(funcionDeRuta("/api/cotizador/plan")).toBe("plan_pdf");
    expect(funcionDeRuta("/cotizador")).toBeNull();
    expect(funcionDeRuta("/documentosx")).toBeNull();
  });
});

describe("descuentoPeriodo", () => {
  const precios = { mensual: 19990, trimestral: 53990, anual: 191990 };

  it("calcula el ahorro frente a pagar mes a mes", () => {
    expect(descuentoPeriodo(precios, "trimestral")).toBe(10);
    expect(descuentoPeriodo(precios, "anual")).toBe(20);
    expect(descuentoPeriodo(precios, "mensual")).toBeNull();
  });

  it("es null si falta un precio", () => {
    expect(descuentoPeriodo({ ...precios, mensual: null }, "anual")).toBeNull();
  });
});

describe("aSuscripcion", () => {
  it("descarta estados desconocidos y períodos inválidos", () => {
    const base = { plan_id: null, fecha_fin_trial: null, fecha_proximo_pago: null };
    expect(aSuscripcion({ ...base, estado: "pausada", periodo: null })).toBeNull();
    expect(aSuscripcion({ ...base, estado: "active", periodo: "semanal" })?.periodo).toBeNull();
    expect(aSuscripcion({ ...base, estado: "active", periodo: "anual" })?.periodo).toBe("anual");
  });
});
