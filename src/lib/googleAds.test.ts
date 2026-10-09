import { describe, expect, it } from "vitest";

import { mensajeErrorGoogle, rangoMetricasAds, sumarMetricasAds, versionAds } from "./googleAds";

describe("rangoMetricasAds", () => {
  it("usa los últimos 30 días si no hay fechas", () => {
    expect(rangoMetricasAds(null, null, "2026-10-09")).toEqual({ desde: "2026-09-10", hasta: "2026-10-09" });
  });

  it("rechaza un inicio posterior al fin", () => {
    expect(rangoMetricasAds("2026-10-09", "2026-03-12", "2026-10-09")).toEqual({
      error: "La fecha inicial es posterior a la final",
    });
  });
});

describe("versionAds", () => {
  it("cambia la versión apagada por la vigente", () => {
    expect(versionAds("v21")).toBe("v25");
    expect(versionAds("v25")).toBe("v25");
  });
});

describe("mensajeErrorGoogle", () => {
  it("usa el detalle de Google y no el Unauthorized genérico", () => {
    expect(
      mensajeErrorGoogle(
        {
          error: {
            message: "Unauthorized",
            details: [{ errors: [{ message: "The developer token is invalid." }] }],
          },
        },
        401,
      ),
    ).toBe("The developer token is invalid.");
    expect(mensajeErrorGoogle({ error: { message: "Unauthorized" } }, 401)).toBe("Google rechazó las credenciales de la cuenta.");
    expect(mensajeErrorGoogle({ error: "unauthorized_client", error_description: "Unauthorized" }, 401)).toBe(
      "El refresh token no pertenece a este Client ID. Genera uno nuevo con ese mismo cliente de Google.",
    );
  });
});

describe("sumarMetricasAds", () => {
  it("suma los días y calcula el CPC con la moneda de la cuenta", () => {
    const resumen = sumarMetricasAds(
      [
        {
          customer: { currencyCode: "CLP" },
          metrics: { impressions: "5000", clicks: "300", interactions: "300", conversions: 30, costMicros: "400000000000" },
        },
        {
          metrics: { impressions: "855", clicks: "30", interactions: "30", conversions: "3", costMicros: "7461000000" },
        },
      ],
      "CLF",
    );
    expect(resumen.moneda).toBe("CLP");
    expect(resumen.impresiones).toBe(5855);
    expect(resumen.clics).toBe(330);
    expect(resumen.interacciones).toBe(330);
    expect(resumen.conversiones).toBe(33);
    expect(resumen.costo).toBeCloseTo(407461);
    expect(resumen.cpc).toBeCloseTo(407461 / 330);
  });
});
