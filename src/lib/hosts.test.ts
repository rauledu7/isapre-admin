import { describe, expect, it } from "vitest";

import { hostsConfig, inicioTrasLogin, pasoHost, superficieDe, type Hosts } from "./hosts";

const hosts: Hosts = { landing: "velora.cl", asesores: "admin.velora.cl", dueno: "panel.velora.cl" };

describe("superficieDe", () => {
  it("reconoce los tres hosts y trata el resto como uno solo", () => {
    expect(superficieDe("velora.cl", hosts)).toBe("landing");
    expect(superficieDe("www.velora.cl", hosts)).toBe("landing");
    expect(superficieDe("admin.velora.cl", hosts)).toBe("asesores");
    expect(superficieDe("panel.velora.cl:443", hosts)).toBe("dueno");
    expect(superficieDe("localhost:3000", hosts)).toBe("unico");
  });

  it("sin dominios configurados todo es unico", () => {
    expect(superficieDe("admin.velora.cl", { landing: null, asesores: null, dueno: null })).toBe("unico");
  });
});

describe("pasoHost", () => {
  it("la landing muestra el inicio y manda el resto a la app", () => {
    expect(pasoHost("landing", "/", hosts)).toEqual({ tipo: "reescribir", pathname: "/inicio" });
    expect(pasoHost("landing", "/cotizador", hosts)).toEqual({
      tipo: "redirigir",
      host: "admin.velora.cl",
      pathname: "/cotizador",
    });
  });

  it("la app de asesores no sirve el panel", () => {
    expect(pasoHost("asesores", "/admin", hosts).tipo).toBe("redirigir");
    expect(pasoHost("asesores", "/api/admin/asesores", hosts)).toMatchObject({ host: "panel.velora.cl", pathname: "/admin" });
    expect(pasoHost("asesores", "/calendario", hosts)).toEqual({ tipo: "seguir" });
  });

  it("el panel solo sirve su login y su administración", () => {
    expect(pasoHost("dueno", "/", hosts)).toEqual({ tipo: "redirigir", host: null, pathname: "/admin" });
    expect(pasoHost("dueno", "/admin", hosts)).toEqual({ tipo: "seguir" });
    expect(pasoHost("dueno", "/login", hosts)).toEqual({ tipo: "seguir" });
    expect(pasoHost("dueno", "/cotizador", hosts)).toMatchObject({ host: "admin.velora.cl", pathname: "/cotizador" });
    expect(pasoHost("dueno", "/api/ges", hosts)).toEqual({ tipo: "bloquear", status: 404 });
  });

  it("sin dominios, /admin convive y /inicio no se publica", () => {
    const unico: Hosts = { landing: null, asesores: null, dueno: null };
    expect(pasoHost("unico", "/admin", unico)).toEqual({ tipo: "seguir" });
    expect(pasoHost("unico", "/inicio", unico)).toEqual({ tipo: "redirigir", host: null, pathname: "/" });
  });
});

describe("inicioTrasLogin", () => {
  it("en el panel vuelve a /admin", () => {
    expect(inicioTrasLogin("dueno")).toBe("/admin");
    expect(inicioTrasLogin("asesores")).toBe("/");
    expect(inicioTrasLogin("unico")).toBe("/");
  });
});

describe("hostsConfig", () => {
  it("acepta el host pelado", () => {
    process.env.LANDING_HOST = "https://Velora.cl/ruta";
    process.env.APP_HOST = "";
    process.env.OWNER_HOST = "panel.velora.cl.";
    expect(hostsConfig()).toEqual({ landing: "velora.cl", asesores: null, dueno: "panel.velora.cl" });
    delete process.env.LANDING_HOST;
    delete process.env.APP_HOST;
    delete process.env.OWNER_HOST;
  });
});
