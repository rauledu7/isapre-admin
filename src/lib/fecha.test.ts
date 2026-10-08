import { describe, expect, it } from "vitest";

import { esFechaISO, fechaISO, formatFecha } from "./fecha";

describe("fecha", () => {
  it("usa el día en Chile, no el del UTC", () => {
    expect(fechaISO(new Date("2026-10-09T02:30:00Z"))).toBe("2026-10-08");
    expect(fechaISO(new Date("2026-10-09T03:30:00Z"))).toBe("2026-10-09");
  });

  it("formatea sin correr el día", () => {
    expect(formatFecha("2026-10-08")).toBe("08-10-2026");
  });

  it("rechaza fechas imposibles", () => {
    expect(esFechaISO("2026-02-31")).toBe(false);
    expect(esFechaISO("2026-10-08")).toBe(true);
  });
});