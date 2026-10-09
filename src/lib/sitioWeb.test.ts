import { describe, expect, it } from "vitest";

import { mismoSitio, normalizarSitio, notaLeadWeb } from "./sitioWeb";

describe("normalizarSitio", () => {
  it("acepta el dominio con o sin https y sin www", () => {
    expect(normalizarSitio("cotizatuisapreya.cl")).toBe("https://cotizatuisapreya.cl");
    expect(normalizarSitio("https://www.cotizatuisapreya.cl/")).toBe("https://cotizatuisapreya.cl");
  });

  it("deja vacío el campo opcional", () => {
    expect(normalizarSitio("  ")).toBeNull();
  });

  it("rechaza una ruta o un texto que no es un sitio", () => {
    expect(normalizarSitio("https://cotizatuisapreya.cl/cotizar")).toBeNull();
    expect(normalizarSitio("no es un sitio")).toBeNull();
  });
});

describe("mismoSitio", () => {
  it("trata www y el dominio pelado como la misma página", () => {
    expect(mismoSitio("https://www.cotizatuisapreya.cl", "https://cotizatuisapreya.cl")).toBe(true);
    expect(mismoSitio("https://otra.cl", "https://cotizatuisapreya.cl")).toBe(false);
  });
});

describe("notaLeadWeb", () => {
  it("marca el contacto como pendiente y guarda el tramo de sueldo", () => {
    expect(
      notaLeadWeb({
        sitio: "https://cotizatuisapreya.cl",
        renta: "$900.000 - $1.500.000",
        cargas: "3+ cargas",
        contacto: "WhatsApp",
      }),
    ).toBe(
      "Por contactar. Llegó desde la web.\nSitio: https://cotizatuisapreya.cl\nSueldo líquido: $900.000 - $1.500.000\nCargas: 3+ cargas\nPrefiere contacto: WhatsApp",
    );
  });
});
