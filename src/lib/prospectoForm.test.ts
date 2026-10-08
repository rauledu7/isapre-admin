import { describe, expect, it } from "vitest";

import { leerProspecto, type ProspectoForm } from "./prospectoForm";

const FORM: ProspectoForm = {
  nombre: "  María Pérez ",
  rut: "12.345.678-5",
  telefono: "9 1234 5678",
  email: "",
  edad: "",
  rentaImponibleCLP: "1.800.000",
  isapreActual: "colmena",
  cargas: ["6", "34"],
  etapaId: "etapa-1",
};

describe("leerProspecto", () => {
  it("normaliza y convierte los datos", () => {
    expect(leerProspecto(FORM)).toEqual({
      ok: true,
      datos: {
        etapaId: "etapa-1",
        nombre: "María Pérez",
        rut: "12345678-5",
        telefono: "+56912345678",
        email: null,
        edad: null,
        rentaImponibleCLP: 1_800_000,
        isapreActual: "colmena",
        cargas: [6, 34],
      },
    });
  });

  it("exige nombre, RUT válido y teléfono", () => {
    const r = leerProspecto({ ...FORM, nombre: " ", rut: "12.345.678-9", telefono: "" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.errores).sort()).toEqual(["nombre", "rut", "telefono"]);
  });

  it("valida opcionales solo si vienen informados", () => {
    const r = leerProspecto({ ...FORM, email: "malo", edad: "200", cargas: [""] });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.errores).sort()).toEqual(["cargas", "edad", "email"]);
  });
});
