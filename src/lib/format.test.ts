import { describe, expect, it } from "vitest";

import {
  formatCLP,
  formatEnteroInput,
  formatUF,
  parseDecimal,
  parseEntero,
  parseMontoCL,
} from "./format";

describe("format", () => {
  it("formatea UF con 4 decimales y coma decimal", () => {
    expect(formatUF(3.5)).toBe("3,5000 UF");
    expect(formatUF(1234.56789)).toBe("1.234,5679 UF");
  });

  it("formatea CLP sin decimales", () => {
    expect(formatCLP(140000.4)).toMatch(/^\$\s?140\.000$/);
  });

  it("agrega separador de miles al input", () => {
    expect(formatEnteroInput("1500000")).toBe("1.500.000");
    expect(formatEnteroInput("1.500.000a")).toBe("1.500.000");
    expect(formatEnteroInput("")).toBe("");
  });
});

describe("parse", () => {
  it("parsea enteros con puntos de miles", () => {
    expect(parseEntero("1.500.000")).toBe(1_500_000);
    expect(parseEntero("")).toBeNull();
    expect(parseEntero("12a")).toBeNull();
  });

  it("parsea decimales con coma o punto", () => {
    expect(parseDecimal("3,25")).toBe(3.25);
    expect(parseDecimal("3.25")).toBe(3.25);
    expect(parseDecimal("4")).toBe(4);
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal("-1")).toBeNull();
    expect(parseDecimal("1,2,3")).toBeNull();
  });

  it("parsea montos es-CL con punto de miles y coma decimal", () => {
    expect(parseMontoCL("41.122,74")).toBe(41122.74);
    expect(parseMontoCL("41122")).toBe(41122);
    expect(parseMontoCL("")).toBeNull();
  });
});
