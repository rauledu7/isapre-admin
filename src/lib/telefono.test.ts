import { describe, expect, it } from "vitest";

import { formatearTelefono, normalizarTelefono } from "./telefono";

describe("teléfono", () => {
  it("normaliza celulares y fijos chilenos", () => {
    expect(normalizarTelefono("912345678")).toBe("+56912345678");
    expect(normalizarTelefono("+56 9 1234 5678")).toBe("+56912345678");
    expect(normalizarTelefono("56912345678")).toBe("+56912345678");
    expect(normalizarTelefono("(2) 2345 6789")).toBe("+56223456789");
  });

  it("rechaza números incompletos", () => {
    expect(normalizarTelefono("")).toBeNull();
    expect(normalizarTelefono("12345")).toBeNull();
    expect(normalizarTelefono("+56 9 1234 567")).toBeNull();
  });

  it("formatea para mostrar", () => {
    expect(formatearTelefono("+56912345678")).toBe("+56 9 1234 5678");
  });
});
