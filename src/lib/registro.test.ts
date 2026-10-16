import { describe, expect, it } from "vitest";

import { intencionRegistro, mensajeRegistro } from "./registro";

describe("intencionRegistro", () => {
  it("sin plan válido parte en la prueba", () => {
    expect(intencionRegistro(null, null)).toEqual({ modo: "trial" });
    expect(intencionRegistro("premium", "anual")).toEqual({ modo: "trial" });
  });

  it("un plan conocido queda para contratar, con período mensual si no viene", () => {
    expect(intencionRegistro("profesional", "anual")).toEqual({ modo: "plan", nivel: "intermedio", periodo: "anual" });
    expect(intencionRegistro("full", "semanal")).toEqual({ modo: "plan", nivel: "full", periodo: "mensual" });
  });
});

describe("mensajeRegistro", () => {
  it("traduce el alta apagada y el correo repetido", () => {
    expect(mensajeRegistro("signup_disabled")).toMatch(/Supabase/);
    expect(mensajeRegistro("email_exists")).toMatch(/ya tiene cuenta/);
    expect(mensajeRegistro("otro")).toMatch(/No se pudo crear/);
  });
});
