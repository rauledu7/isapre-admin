import type { CuentaGoogleAds } from "@/lib/cuentaGoogleAds";
import { esFechaISO, sumarDias } from "@/lib/fecha";

export interface ResumenAds {
  moneda: string;
  impresiones: number;
  clics: number;
  interacciones: number;
  conversiones: number;
  costo: number;
  cpc: number | null;
}

interface FilaAds {
  customer?: { currencyCode?: string };
  metrics?: {
    impressions?: string;
    clicks?: string;
    interactions?: string;
    conversions?: string | number;
    costMicros?: string;
  };
}

/** Rango inclusivo. Sin fechas, los últimos 30 días hasta `hoy`. */
export function rangoMetricasAds(
  desde: string | null,
  hasta: string | null,
  hoy: string,
): { desde: string; hasta: string } | { error: string } {
  if (!esFechaISO(hoy)) return { error: "Fecha inválida" };
  const fin = hasta == null || hasta === "" ? hoy : hasta;
  const inicio = desde == null || desde === "" ? sumarDias(fin, -29) : desde;
  if (!esFechaISO(inicio) || !esFechaISO(fin)) return { error: "Fecha inválida" };
  if (inicio > fin) return { error: "La fecha inicial es posterior a la final" };
  return { desde: inicio, hasta: fin };
}

export function sumarMetricasAds(filas: FilaAds[], monedaPorDefecto: string): ResumenAds {
  let impresiones = 0;
  let clics = 0;
  let interacciones = 0;
  let conversiones = 0;
  let costoMicros = 0;
  let moneda = monedaPorDefecto;
  for (const fila of filas) {
    impresiones += Number(fila.metrics?.impressions ?? 0);
    clics += Number(fila.metrics?.clicks ?? 0);
    interacciones += Number(fila.metrics?.interactions ?? 0);
    conversiones += Number(fila.metrics?.conversions ?? 0);
    costoMicros += Number(fila.metrics?.costMicros ?? 0);
    if (fila.customer?.currencyCode) moneda = fila.customer.currencyCode;
  }
  const costo = costoMicros / 1_000_000;
  return {
    moneda,
    impresiones,
    clics,
    interacciones,
    conversiones,
    costo,
    cpc: clics > 0 ? costo / clics : null,
  };
}

/** v21 quedó fuera de servicio el 5 de agosto de 2026. v22 cierra en octubre de 2026. */
const VERSIONES_VIGENTES = new Set(["v23", "v24", "v25"]);

export function versionAds(guardada: string): string {
  return VERSIONES_VIGENTES.has(guardada) ? guardada : "v25";
}

export function mensajeErrorGoogle(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const error = (body as { error?: unknown }).error;
    if (error && typeof error === "object") {
      const detalles = (error as { details?: unknown }).details;
      if (Array.isArray(detalles)) {
        for (const detalle of detalles) {
          const errores = detalle && typeof detalle === "object" ? (detalle as { errors?: unknown }).errors : undefined;
          if (!Array.isArray(errores)) continue;
          for (const item of errores) {
            const mensaje = item && typeof item === "object" ? (item as { message?: unknown }).message : undefined;
            if (typeof mensaje === "string" && mensaje.trim()) return mensaje;
          }
        }
      }
      const mensaje = (error as { message?: unknown }).message;
      if (typeof mensaje === "string" && mensaje.trim() && mensaje !== "Unauthorized") return mensaje;
    }
    const descripcion = (body as { error_description?: unknown }).error_description;
    if (typeof descripcion === "string" && descripcion.trim() && descripcion !== "Unauthorized") return descripcion;
  }
  if (status === 401) return "Google rechazó las credenciales de la cuenta.";
  if (status === 404) return "Google ya no acepta esta versión de la API.";
  return "Google Ads no entregó las cifras";
}

/** "yyyy-mm-dd HH:mm:ss±HH:mm" en hora de Chile, el formato que pide Google Ads. */
export function fechaConversionAds(ahora: Date): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "longOffset",
  }).formatToParts(ahora);
  const leer = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((parte) => parte.type === tipo)?.value ?? "";
  const crudo = leer("timeZoneName").replace("GMT", "");
  const match = /([+-])(\d{1,2})(?::?(\d{2}))?/.exec(crudo);
  const signo = match?.[1];
  const horas = match?.[2];
  const offset = signo && horas ? `${signo}${horas.padStart(2, "0")}:${(match?.[3] ?? "00").padStart(2, "0")}` : "+00:00";
  return `${leer("year")}-${leer("month")}-${leer("day")} ${leer("hour")}:${leer("minute")}:${leer("second")}${offset}`;
}

async function accessToken(cuenta: CuentaGoogleAds): Promise<string> {
  const respuesta = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cuenta.clientId,
      client_secret: cuenta.clientSecret,
      refresh_token: cuenta.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const json = (await respuesta.json().catch(() => null)) as { access_token?: string } | null;
  if (!respuesta.ok || !json?.access_token) {
    throw new Error(mensajeErrorGoogle(json, respuesta.status));
  }
  return json.access_token;
}

function headers(cuenta: CuentaGoogleAds, token: string): HeadersInit {
  const login = cuenta.loginCustomerId?.replace(/\D/g, "") ?? "";
  return {
    Authorization: `Bearer ${token}`,
    "developer-token": cuenta.developerToken,
    "Content-Type": "application/json",
    ...(login ? { "login-customer-id": login } : {}),
  };
}

export async function enviarConversionOffline(
  cuenta: CuentaGoogleAds,
  entrada: { gclid: string; uf: number; instante: Date },
): Promise<void> {
  const id = cuenta.customerId;
  const token = await accessToken(cuenta);
  const respuesta = await fetch(`https://googleads.googleapis.com/${versionAds(cuenta.apiVersion)}/customers/${id}:uploadClickConversions`, {
    method: "POST",
    headers: headers(cuenta, token),
    body: JSON.stringify({
      partialFailure: true,
      conversions: [
        {
          gclid: entrada.gclid,
          conversionAction: `customers/${id}/conversionActions/${cuenta.conversionActionId}`,
          conversionDateTime: fechaConversionAds(entrada.instante),
          conversionValue: entrada.uf,
          currencyCode: cuenta.currency,
        },
      ],
    }),
  });
  const json = (await respuesta.json().catch(() => null)) as { partialFailureError?: { message?: string } } | null;
  if (!respuesta.ok || json?.partialFailureError) {
    throw new Error(json?.partialFailureError?.message || mensajeErrorGoogle(json, respuesta.status));
  }
}

export async function resumenCuentaAds(cuenta: CuentaGoogleAds, desde: string, hasta: string): Promise<ResumenAds> {
  const id = cuenta.customerId;
  const token = await accessToken(cuenta);
  const respuesta = await fetch(`https://googleads.googleapis.com/${versionAds(cuenta.apiVersion)}/customers/${id}/googleAds:search`, {
    method: "POST",
    headers: headers(cuenta, token),
    body: JSON.stringify({
      query: `SELECT customer.currency_code, metrics.impressions, metrics.clicks, metrics.interactions, metrics.conversions, metrics.cost_micros FROM customer WHERE segments.date BETWEEN '${desde}' AND '${hasta}'`,
    }),
  });
  const json = (await respuesta.json().catch(() => null)) as { results?: FilaAds[] } | null;
  if (!respuesta.ok || !json) {
    throw new Error(mensajeErrorGoogle(json, respuesta.status));
  }
  return sumarMetricasAds(json.results ?? [], cuenta.currency);
}
