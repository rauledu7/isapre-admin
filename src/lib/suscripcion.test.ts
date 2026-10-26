import { describe, expect, it } from "vitest";

import {
  aSuscripcion,
  descuentoPeriodo,
  diasRestantesTrial,
  funcionDeRuta,
  inicioCobro,
  nivelEfectivo,
  maxPlanesComparar,
  permite,
  rutaSinSuscripcion,
  suscripcionVigente,
  type Suscripcion,
} from "./suscripcion";

const ahora = new Date("2026-10-16T12:00:00Z");

function sus(parcial: Partial<Suscripcion>): Suscripcion {
  return { estado: "trialing", planId: null, periodo: null, fechaFinTrial: null, fechaProximoPago: null, bloqueado: false, ...parcial };
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

  it("bloqueada por el administrador no tiene acceso", () => {
    expect(suscripcionVigente(sus({ estado: "active", bloqueado: true }), ahora)).toBe(false);
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

  it("el profesional compara, guarda prospectos y no llega al embudo ni a los tarifarios", () => {
    expect(permite("intermedio", "comparador")).toBe(true);
    expect(permite("intermedio", "prospectos")).toBe(true);
    expect(permite("intermedio", "propuesta")).toBe(true);
    expect(permite("intermedio", "isapres")).toBe(true);
    expect(permite("intermedio", "pipeline")).toBe(true);
    expect(permite("intermedio", "notificaciones")).toBe(true);
    expect(permite("intermedio", "embudo")).toBe(false);
    expect(permite("intermedio", "plan_pdf")).toBe(false);
    expect(permite("intermedio", "documentos")).toBe(false);
    expect(permite("intermedio", "tarifarios")).toBe(false);
    expect(permite("intermedio", "importar")).toBe(false);
    expect(permite("intermedio", "etapas")).toBe(false);
    expect(permite("intermedio", "google_ads")).toBe(false);
    expect(permite("intermedio", "leads_web")).toBe(false);
  });

  it("el comparador admite dos planes en Profesional y cuatro en Full", () => {
    expect(maxPlanesComparar("basico")).toBe(0);
    expect(maxPlanesComparar("intermedio")).toBe(2);
    expect(maxPlanesComparar("full")).toBe(4);
    expect(permite("full", "embudo")).toBe(true);
    expect(permite("full", "ges_auto")).toBe(true);
    expect(permite("full", "leads_web")).toBe(true);
  });

  it("el trial y la suscripción sin plan usan el full", () => {
    expect(nivelEfectivo(sus({ fechaFinTrial: "2026-10-20T00:00:00Z", planId: "p" }), "basico", ahora)).toBe("full");
    expect(nivelEfectivo(sus({ estado: "active" }), null, ahora)).toBe("full");
    expect(nivelEfectivo(sus({ estado: "active", planId: "p" }), "basico", ahora)).toBe("basico");
  });

  it("contratar durante la prueba mantiene el full hasta que termine", () => {
    const contratado = sus({ estado: "active", planId: "p", fechaFinTrial: "2026-10-20T00:00:00Z" });
    expect(nivelEfectivo(contratado, "basico", ahora)).toBe("full");
    expect(nivelEfectivo(contratado, "basico", new Date("2026-10-21T00:00:00Z"))).toBe("basico");
  });
});

describe("inicioCobro", () => {
  it("parte al terminar la prueba", () => {
    expect(inicioCobro(sus({ fechaFinTrial: "2026-10-20T00:00:00Z" }), ahora)).toBe("2026-10-20T00:00:00Z");
  });

  it("parte al terminar el período pagado al cambiar de plan", () => {
    expect(inicioCobro(sus({ estado: "active", fechaProximoPago: "2026-11-01T00:00:00Z" }), ahora)).toBe(
      "2026-11-01T00:00:00Z",
    );
  });

  it("cobra de inmediato si no queda nada pagado", () => {
    expect(inicioCobro(sus({ fechaFinTrial: "2026-10-01T00:00:00Z" }), ahora)).toBeNull();
    expect(inicioCobro(sus({ estado: "past_due", fechaProximoPago: "2026-11-01T00:00:00Z" }), ahora)).toBeNull();
    expect(inicioCobro(sus({ estado: "active" }), ahora)).toBeNull();
  });

  it("asocia rutas a funciones", () => {
    expect(funcionDeRuta("/documentos")).toBe("documentos");
    expect(funcionDeRuta("/api/ads/metricas")).toBe("google_ads");
    expect(funcionDeRuta("/api/cotizador/plan")).toBe("plan_pdf");
    expect(funcionDeRuta("/prospectos")).toBe("prospectos");
    expect(funcionDeRuta("/isapres")).toBe("isapres");
    expect(funcionDeRuta("/api/ges")).toBe("isapres");
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
