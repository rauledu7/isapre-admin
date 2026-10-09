import { describe, expect, it } from "vitest";

import { conMetricas, costoPorLead, leerLead, resumenCampanas } from "./adquisicion";
import { fechaConversionAds } from "./googleAds";

describe("leerLead", () => {
  it("acepta un lead de landing con gclid y UTM", () => {
    const lectura = leerLead({
      nombre: " Ana Pérez ",
      rut: "12.345.678-5",
      telefono: "9 1234 5678",
      email: "ana@correo.cl",
      gclid: "abc123",
      utm_source: "google",
      utm_campaign: "Marca",
      utm_kw: "isapre",
    });
    expect(lectura).toEqual({
      ok: true,
      datos: {
        nombre: "Ana Pérez",
        rut: "12345678-5",
        telefono: "+56912345678",
        email: "ana@correo.cl",
        gclid: "abc123",
        utmSource: "google",
        utmCampaign: "Marca",
        utmKw: "isapre",
      },
    });
  });

  it("rechaza un lead sin teléfono o con RUT inválido", () => {
    const lectura = leerLead({ nombre: "Ana", rut: "12.345.678-9", telefono: "" });
    expect(lectura.ok).toBe(false);
    if (lectura.ok) return;
    expect(lectura.errores).toEqual(["RUT inválido", "Falta el teléfono"]);
  });
});

describe("fechaConversionAds", () => {
  it("usa la hora de Chile con offset", () => {
    expect(fechaConversionAds(new Date("2026-10-08T13:00:00Z"))).toBe("2026-10-08 10:00:00-03:00");
  });
});

describe("resumenCampanas", () => {
  const etapas = [
    { id: "abierta", tipo: "abierta" as const },
    { id: "ganada", tipo: "ganada" as const },
  ];

  it("agrupa leads, cierres y UF por campaña", () => {
    const filas = resumenCampanas(
      [
        { utmCampaign: "Marca", etapaId: "ganada", ufCierre: 3.2 },
        { utmCampaign: "Marca", etapaId: "abierta", ufCierre: null },
        { utmCampaign: null, etapaId: "abierta", ufCierre: null },
      ],
      etapas,
    );
    expect(filas).toEqual([
      { campana: "Marca", leads: 2, cierres: 1, ufCerradas: 3.2 },
      { campana: "Sin campaña", leads: 1, cierres: 0, ufCerradas: 0 },
    ]);
  });

  it("suma clics y gasto cuando el nombre de campaña coincide", () => {
    const filas = conMetricas([{ campana: "Marca", leads: 2, cierres: 1, ufCerradas: 3.2 }], [
      { nombre: "marca", clics: 40, gasto: 20000 },
      { nombre: "Display", clics: 10, gasto: 5000 },
    ]);
    expect(filas[0]).toMatchObject({ clics: 40, gasto: 20000 });
    expect(filas[1]).toMatchObject({ campana: "Display", leads: 0, clics: 10 });
    expect(costoPorLead(20000, 2)).toBe(10000);
    expect(costoPorLead(null, 2)).toBeNull();
  });
});
