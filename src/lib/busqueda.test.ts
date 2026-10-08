import { describe, expect, it } from "vitest";

import { coincideProspecto, filtrarProspectos } from "./busqueda";

const juan = { nombre: "Juan Pérez Soto", rut: "12345678-5" };
const maria = { nombre: "María José Muñoz", rut: "9876543-K" };

describe("coincideProspecto", () => {
  it("consulta vacía coincide con todo", () => {
    expect(coincideProspecto(juan, "  ")).toBe(true);
  });

  it("busca por nombre sin tildes ni mayúsculas", () => {
    expect(coincideProspecto(juan, "perez")).toBe(true);
    expect(coincideProspecto(maria, "MUNOZ")).toBe(true);
    expect(coincideProspecto(maria, "muñoz")).toBe(true);
  });

  it("todas las palabras deben estar, en cualquier orden", () => {
    expect(coincideProspecto(juan, "soto juan")).toBe(true);
    expect(coincideProspecto(juan, "juan muñoz")).toBe(false);
  });

  it("busca por RUT con o sin puntos y guion", () => {
    expect(coincideProspecto(juan, "12.345.678-5")).toBe(true);
    expect(coincideProspecto(juan, "123456785")).toBe(true);
    expect(coincideProspecto(juan, "345.678")).toBe(true);
    expect(coincideProspecto(maria, "9.876.543-k")).toBe(true);
  });

  it("no busca RUT con menos de 3 dígitos", () => {
    expect(coincideProspecto(juan, "12")).toBe(false);
  });
});

describe("filtrarProspectos", () => {
  it("filtra la lista", () => {
    expect(filtrarProspectos([juan, maria], "maria")).toEqual([maria]);
    expect(filtrarProspectos([juan, maria], "")).toEqual([juan, maria]);
  });
});
