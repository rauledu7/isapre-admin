import { describe, expect, it } from "vitest";

import { categoriaAsesor, filtrarAsesores, finTrialExtendido, metricasAdmin, type AsesorAdmin } from "./adminAsesores";
import type { Suscripcion } from "./suscripcion";

const ahora = new Date("2026-10-16T15:00:00Z");

function sus(parcial: Partial<Suscripcion>): Suscripcion {
  return { estado: "trialing", planId: null, periodo: null, fechaFinTrial: null, fechaProximoPago: null, bloqueado: false, ...parcial };
}

function asesor(id: string, suscripcion: Suscripcion | null, extra: Partial<AsesorAdmin> = {}): AsesorAdmin {
  return { id, email: `${id}@mail.cl`, nombre: null, creadoEn: "2026-10-01T00:00:00Z", ultimoIngreso: null, suscripcion, planNombre: null, ...extra };
}

describe("categoriaAsesor", () => {
  it("clasifica cada estado", () => {
    expect(categoriaAsesor(null, ahora)).toBe("sin_suscripcion");
    expect(categoriaAsesor(sus({ fechaFinTrial: "2026-10-20T00:00:00Z" }), ahora)).toBe("trial");
    expect(categoriaAsesor(sus({ fechaFinTrial: "2026-10-10T00:00:00Z" }), ahora)).toBe("vencido");
    expect(categoriaAsesor(sus({ estado: "active", planId: "p" }), ahora)).toBe("pagado");
    expect(categoriaAsesor(sus({ estado: "active" }), ahora)).toBe("cortesia");
    expect(categoriaAsesor(sus({ estado: "past_due", planId: "p" }), ahora)).toBe("pendiente");
    expect(categoriaAsesor(sus({ estado: "canceled", fechaProximoPago: "2026-11-01T00:00:00Z" }), ahora)).toBe("cancelado");
    expect(categoriaAsesor(sus({ estado: "active", planId: "p", bloqueado: true }), ahora)).toBe("bloqueado");
  });
});

describe("metricasAdmin", () => {
  it("cuenta asesores y suma solo pagos aprobados, total y del mes en Chile", () => {
    const asesores = [
      asesor("a", sus({ fechaFinTrial: "2026-10-20T00:00:00Z" })),
      asesor("b", sus({ estado: "active", planId: "p" })),
      asesor("c", sus({ estado: "active" })),
    ];
    const pagos = [
      { montoCLP: 19990, estado: "approved", fecha: "2026-10-05T12:00:00Z" },
      { montoCLP: 29990, estado: "approved", fecha: "2026-09-20T12:00:00Z" },
      { montoCLP: 9990, estado: "rejected", fecha: "2026-10-06T12:00:00Z" },
      // 1 de octubre 01:00 UTC todavía es 30 de septiembre en Chile.
      { montoCLP: 1000, estado: "approved", fecha: "2026-10-01T01:00:00Z" },
    ];
    expect(metricasAdmin(asesores, pagos, ahora)).toEqual({
      total: 3,
      enTrial: 1,
      pagados: 1,
      cortesia: 1,
      pendientes: 0,
      bloqueados: 0,
      ingresosTotalCLP: 50980,
      ingresosMesCLP: 19990,
    });
  });
});

describe("filtrarAsesores", () => {
  it("busca por email o nombre sin importar tildes ni mayúsculas", () => {
    const lista = [asesor("ana", null, { nombre: "Ana Muñoz" }), asesor("jose", null, { nombre: "José Pérez" })];
    expect(filtrarAsesores(lista, "PEREZ").map((a) => a.id)).toEqual(["jose"]);
    expect(filtrarAsesores(lista, "ana@").map((a) => a.id)).toEqual(["ana"]);
    expect(filtrarAsesores(lista, "  ")).toHaveLength(2);
  });
});

describe("finTrialExtendido", () => {
  it("suma desde el fin si sigue vigente, o desde hoy si ya venció", () => {
    expect(finTrialExtendido("2026-10-20T00:00:00Z", ahora)).toBe("2026-10-27T00:00:00.000Z");
    expect(finTrialExtendido("2026-10-01T00:00:00Z", ahora)).toBe("2026-10-23T15:00:00.000Z");
    expect(finTrialExtendido(null, ahora)).toBe("2026-10-23T15:00:00.000Z");
  });
});
