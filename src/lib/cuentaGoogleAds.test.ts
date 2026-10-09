import { describe, expect, it } from "vitest";

import { fusionarCuenta, vistaCuenta, type CuentaGoogleAds } from "./cuentaGoogleAds";

const COMPLETA: CuentaGoogleAds = {
  developerToken: "dev",
  clientId: "cliente.apps.googleusercontent.com",
  clientSecret: "secreto",
  refreshToken: "refresh",
  customerId: "1234567890",
  loginCustomerId: null,
  conversionActionId: "99",
  currency: "CLF",
  apiVersion: "v25",
};

describe("fusionarCuenta", () => {
  it("exige los secretos la primera vez y normaliza los IDs", () => {
    const lectura = fusionarCuenta(null, {
      developerToken: "dev",
      clientId: "cliente.apps.googleusercontent.com",
      clientSecret: "secreto",
      refreshToken: "refresh",
      customerId: "123-456-7890",
      loginCustomerId: "",
      conversionActionId: "99",
      currency: "",
      apiVersion: "",
    });
    expect(lectura).toEqual({ ok: true, cuenta: COMPLETA });
  });

  it("conserva los secretos si el formulario los deja vacíos", () => {
    const lectura = fusionarCuenta(COMPLETA, {
      developerToken: "",
      clientId: COMPLETA.clientId,
      clientSecret: "   ",
      refreshToken: "",
      customerId: COMPLETA.customerId,
      loginCustomerId: "",
      conversionActionId: COMPLETA.conversionActionId,
      currency: "CLF",
      apiVersion: "v21",
    });
    expect(lectura.ok).toBe(true);
    if (!lectura.ok) return;
    expect(lectura.cuenta.developerToken).toBe("dev");
    expect(lectura.cuenta.clientSecret).toBe("secreto");
    const vista = vistaCuenta(lectura.cuenta);
    expect(vista.tieneRefreshToken).toBe(true);
    expect(JSON.stringify(vista)).not.toContain("secreto");
  });

  it("rechaza una cuenta nueva sin refresh token", () => {
    const lectura = fusionarCuenta(null, {
      developerToken: "dev",
      clientId: "cliente",
      clientSecret: "secreto",
      refreshToken: "",
      customerId: "123",
      loginCustomerId: "",
      conversionActionId: "99",
      currency: "CLF",
      apiVersion: "v21",
    });
    expect(lectura.ok).toBe(false);
    if (lectura.ok) return;
    expect(lectura.errores.refreshToken).toBe("Falta el refresh token");
  });
});
