import { describe, expect, it } from "vitest";

import { esFechaISO, fechaISO, formatFecha, instanteEnChile } from "./fecha";

describe("fecha", () => {
  it("usa el día en Chile, no el del UTC", () => {
    expect(fechaISO(new Date("2026-10-09T02:30:00Z"))).toBe("2026-10-08");
    expect(fechaISO(new Date("2026-10-09T03:30:00Z"))).toBe("2026-10-09");
  });

  it("formatea sin correr el día", () => {
    expect(formatFecha("2026-10-08")).toBe("08-10-2026");
  });

  it("arma un instante que en Chile cae en esa fecha y hora", () => {
    const instante = instanteEnChile("2026-10-08", "10:15");
    expect(fechaISO(instante)).toBe("2026-10-08");
    const hora = new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Santiago",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(instante);
    expect(hora).toBe("10:15");
  });

  it("rechaza fechas imposibles", () => {
    expect(esFechaISO("2026-02-31")).toBe(false);
    expect(esFechaISO("2026-10-08")).toBe(true);
  });
});