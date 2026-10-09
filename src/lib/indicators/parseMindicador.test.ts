import { describe, expect, it } from "vitest";

import { parseRespuestaUF } from "./parseMindicador";

describe("parseRespuestaUF", () => {
  it("toma el primer valor de la serie con fecha en hora de Chile", () => {
    const r = parseRespuestaUF({
      serie: [
        { fecha: "2026-10-08T03:00:00.000Z", valor: 41122.74 },
        { fecha: "2026-10-07T03:00:00.000Z", valor: 41114.54 },
      ],
    });
    expect(r).toEqual({ valor: 41122.74, fecha: "2026-10-08", fuente: "mindicador" });
  });

  it("acepta el valor del día cuando viene en uf y no en serie", () => {
    const r = parseRespuestaUF({
      uf: { fecha: "2026-10-08T03:00:00.000Z", valor: 41122.74 },
    });
    expect(r).toEqual({ valor: 41122.74, fecha: "2026-10-08", fuente: "mindicador" });
  });

  it("rechaza respuestas malformadas", () => {
    expect(() => parseRespuestaUF(null)).toThrow();
    expect(() => parseRespuestaUF({ serie: [] })).toThrow();
    expect(() => parseRespuestaUF({ serie: [{ fecha: "x", valor: 1 }] })).toThrow();
    expect(() =>
      parseRespuestaUF({ serie: [{ fecha: "2026-10-08T03:00:00.000Z", valor: 0 }] }),
    ).toThrow();
  });
});
