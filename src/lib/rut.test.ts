import { describe, expect, it } from "vitest";

import { calcularDV, formatearRut, normalizarRut } from "./rut";

describe("RUT", () => {
  it("calcula el dígito verificador con módulo 11", () => {
    expect(calcularDV(11111111)).toBe("1");
    expect(calcularDV(12345678)).toBe("5");
    expect(calcularDV(10000013)).toBe("K");
    expect(calcularDV(76086428)).toBe("5");
  });

  it("normaliza formatos comunes", () => {
    expect(normalizarRut("12.345.678-5")).toBe("12345678-5");
    expect(normalizarRut("123456785")).toBe("12345678-5");
    expect(normalizarRut("10.000.013-k")).toBe("10000013-K");
    expect(normalizarRut(" 11111111-1 ")).toBe("11111111-1");
  });

  it("rechaza RUT inválidos", () => {
    expect(normalizarRut("12.345.678-9")).toBeNull();
    expect(normalizarRut("0-0")).toBeNull();
    expect(normalizarRut("abc")).toBeNull();
    expect(normalizarRut("")).toBeNull();
  });

  it("formatea con puntos", () => {
    expect(formatearRut("12345678-5")).toBe("12.345.678-5");
    expect(formatearRut("10000013-K")).toBe("10.000.013-K");
  });
});
