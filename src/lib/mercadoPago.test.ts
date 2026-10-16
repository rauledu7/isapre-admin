import { describe, expect, it } from "vitest";

import { estadoPorPago, estadoPorPreapproval, leerReferencia, referenciaSuscripcion } from "./mercadoPago";

const perfilId = "7d0c1f8e-2b7a-4c55-9d3e-1a2b3c4d5e6f";
const planId = "0f9e8d7c-6b5a-4e3d-8c2b-1a0f9e8d7c6b";

describe("referencia de suscripción", () => {
  it("ida y vuelta", () => {
    const ref = referenciaSuscripcion({ perfilId, planId, periodo: "trimestral" });
    expect(leerReferencia(ref)).toEqual({ perfilId, planId, periodo: "trimestral" });
  });

  it("rechaza referencias ajenas o incompletas", () => {
    expect(leerReferencia(null)).toBeNull();
    expect(leerReferencia("YG-1234")).toBeNull();
    expect(leerReferencia(`${perfilId}|${planId}|semanal`)).toBeNull();
    expect(leerReferencia(`${perfilId}|no-uuid|anual`)).toBeNull();
    expect(leerReferencia(`${perfilId}|${planId}|anual|extra`)).toBeNull();
  });
});

describe("estados de Mercado Pago", () => {
  it("suscripción", () => {
    expect(estadoPorPreapproval("authorized")).toBe("active");
    expect(estadoPorPreapproval("paused")).toBe("past_due");
    expect(estadoPorPreapproval("cancelled")).toBe("canceled");
    expect(estadoPorPreapproval("pending")).toBeNull();
  });

  it("cobro", () => {
    expect(estadoPorPago("approved")).toBe("active");
    expect(estadoPorPago("rejected")).toBe("past_due");
    expect(estadoPorPago("in_process")).toBeNull();
  });
});
