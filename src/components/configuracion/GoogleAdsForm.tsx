"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Campo } from "@/components/calculator/Campo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formularioDesde,
  fusionarCuenta,
  vistaCuenta,
  type ErroresCuenta,
  type VistaCuentaGoogleAds,
} from "@/lib/cuentaGoogleAds";

const VACIO = {
  developerToken: "",
  clientId: "",
  clientSecret: "",
  refreshToken: "",
  customerId: "",
  loginCustomerId: "",
  conversionActionId: "",
  currency: "CLF",
  apiVersion: "v21",
};

export function GoogleAdsForm() {
  const [vista, setVista] = useState<VistaCuentaGoogleAds | null>(null);
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState<ErroresCuenta>({});
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vivo = true;
    void fetch("/api/ads/cuenta")
      .then(async (respuesta) => ({ ok: respuesta.ok, json: (await respuesta.json().catch(() => null)) as VistaCuentaGoogleAds | null }))
      .then(({ ok, json }) => {
        if (!vivo) return;
        if (!ok || !json) {
          setVista(vistaCuenta(null));
          setError("No se pudo cargar la cuenta. Si acabas de actualizar, corre la migración de Google Ads.");
          return;
        }
        setVista(json);
        setForm((actual) => ({
          ...actual,
          clientId: json.clientId,
          customerId: json.customerId,
          loginCustomerId: json.loginCustomerId,
          conversionActionId: json.conversionActionId,
          currency: json.currency || "CLF",
          apiVersion: json.apiVersion || "v21",
        }));
      })
      .catch(() => {
        if (!vivo) return;
        setVista(vistaCuenta(null));
        setError("No se pudo cargar la cuenta de Google Ads.");
      });
    return () => {
      vivo = false;
    };
  }, []);

  function set(campo: keyof typeof VACIO, valor: string) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const anterior = vista?.conectada
      ? {
          developerToken: vista.tieneDeveloperToken ? "guardado" : "",
          clientId: form.clientId,
          clientSecret: vista.tieneClientSecret ? "guardado" : "",
          refreshToken: vista.tieneRefreshToken ? "guardado" : "",
          customerId: form.customerId,
          loginCustomerId: form.loginCustomerId || null,
          conversionActionId: form.conversionActionId,
          currency: form.currency || "CLF",
          apiVersion: form.apiVersion || "v21",
        }
      : null;
    const lectura = fusionarCuenta(anterior, formularioDesde(form));
    if (!lectura.ok) {
      setErrores(lectura.errores);
      setListo(null);
      return;
    }
    setErrores({});
    setGuardando(true);
    setError(null);
    setListo(null);
    try {
      const respuesta = await fetch("/api/ads/cuenta", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await respuesta.json()) as VistaCuentaGoogleAds & { error?: string; errores?: ErroresCuenta };
      if (!respuesta.ok) {
        if (json.errores) setErrores(json.errores);
        setError(json.error ?? "No se pudo guardar");
        return;
      }
      setVista(json);
      setForm((actual) => ({ ...actual, developerToken: "", clientSecret: "", refreshToken: "" }));
      setListo("Cuenta guardada. Clics, gasto y conversiones usan estos datos.");
    } catch {
      setError("No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  const ayuda = (mensaje?: string, reserva?: string) =>
    mensaje ? <span className="text-destructive">{mensaje}</span> : reserva;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuenta de Google Ads</CardTitle>
        <CardDescription>
          {vista?.conectada
            ? "Conectada. Los secretos no se vuelven a mostrar; déjalos vacíos para conservarlos."
            : "Pega las credenciales de tu cuenta. Quedan guardadas para tu usuario, sin tocar el servidor."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Campo
            label="ID de cliente *"
            inputMode="numeric"
            placeholder="123-456-7890"
            value={form.customerId}
            onChange={(e) => set("customerId", e.target.value)}
            aria-invalid={Boolean(errores.customerId)}
            ayuda={ayuda(errores.customerId, "El número de la cuenta, con o sin guiones.")}
            autoComplete="off"
          />
          <Campo
            label="ID de la cuenta administradora"
            inputMode="numeric"
            value={form.loginCustomerId}
            onChange={(e) => set("loginCustomerId", e.target.value)}
            aria-invalid={Boolean(errores.loginCustomerId)}
            ayuda={ayuda(errores.loginCustomerId, "Solo si entras a través de un MCC.")}
            autoComplete="off"
          />
          <Campo
            label="Client ID *"
            value={form.clientId}
            onChange={(e) => set("clientId", e.target.value)}
            aria-invalid={Boolean(errores.clientId)}
            ayuda={ayuda(errores.clientId)}
            autoComplete="off"
            className="sm:col-span-2"
          />
          <Campo
            label={vista?.tieneClientSecret ? "Client secret" : "Client secret *"}
            type="password"
            value={form.clientSecret}
            onChange={(e) => set("clientSecret", e.target.value)}
            aria-invalid={Boolean(errores.clientSecret)}
            ayuda={ayuda(errores.clientSecret, vista?.tieneClientSecret ? "Guardado." : undefined)}
            autoComplete="new-password"
          />
          <Campo
            label={vista?.tieneDeveloperToken ? "Developer token" : "Developer token *"}
            type="password"
            value={form.developerToken}
            onChange={(e) => set("developerToken", e.target.value)}
            aria-invalid={Boolean(errores.developerToken)}
            ayuda={ayuda(errores.developerToken, vista?.tieneDeveloperToken ? "Guardado." : undefined)}
            autoComplete="new-password"
          />
          <Campo
            label={vista?.tieneRefreshToken ? "Refresh token" : "Refresh token *"}
            type="password"
            value={form.refreshToken}
            onChange={(e) => set("refreshToken", e.target.value)}
            aria-invalid={Boolean(errores.refreshToken)}
            ayuda={ayuda(errores.refreshToken, vista?.tieneRefreshToken ? "Guardado." : undefined)}
            autoComplete="new-password"
            className="sm:col-span-2"
          />
          <Campo
            label="ID de la acción de conversión *"
            inputMode="numeric"
            value={form.conversionActionId}
            onChange={(e) => set("conversionActionId", e.target.value)}
            aria-invalid={Boolean(errores.conversionActionId)}
            ayuda={ayuda(errores.conversionActionId, "La conversión offline que recibe el valor en UF.")}
            autoComplete="off"
          />
          <Campo
            label="Moneda"
            value={form.currency}
            onChange={(e) => set("currency", e.target.value.toUpperCase())}
            aria-invalid={Boolean(errores.currency)}
            ayuda={ayuda(errores.currency, "CLF es el código de la UF. Debe coincidir con la cuenta.")}
            autoComplete="off"
          />
          {error && (
            <p role="alert" className="text-sm text-destructive sm:col-span-2">
              {error}
            </p>
          )}
          {listo && <p className="text-sm text-muted-foreground sm:col-span-2">{listo}</p>}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={guardando || vista === null}>
              {guardando ? "Guardando…" : "Guardar cuenta"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
