import { describe, expect, it } from "vitest";

import { rangoMetricasAds, sumarMetricasAds } from "./googleAds";

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
