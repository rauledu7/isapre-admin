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
  const json = (await respuesta.json()) as { access_token?: string; error_description?: string };
  if (!respuesta.ok || !json.access_token) {
    throw new Error(json.error_description || "No se pudo renovar el token de Google Ads");
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
  const respuesta = await fetch(`https://googleads.googleapis.com/${cuenta.apiVersion}/customers/${id}:uploadClickConversions`, {
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
  const json = (await respuesta.json()) as {
    error?: { message?: string };
    partialFailureError?: { message?: string };
  };
  if (!respuesta.ok || json.partialFailureError) {
    throw new Error(json.partialFailureError?.message || json.error?.message || "Google Ads rechazó la conversión");
  }
}

export async function resumenCuentaAds(cuenta: CuentaGoogleAds, desde: string, hasta: string): Promise<ResumenAds> {
  const id = cuenta.customerId;
  const token = await accessToken(cuenta);
  const respuesta = await fetch(`https://googleads.googleapis.com/${cuenta.apiVersion}/customers/${id}/googleAds:search`, {
    method: "POST",
    headers: headers(cuenta, token),
    body: JSON.stringify({
      query: `SELECT customer.currency_code, metrics.impressions, metrics.clicks, metrics.interactions, metrics.conversions, metrics.cost_micros FROM customer WHERE segments.date BETWEEN '${desde}' AND '${hasta}'`,
    }),
  });
  const json = (await respuesta.json()) as {
    error?: { message?: string };
    results?: FilaAds[];
  };
  if (!respuesta.ok) {
    throw new Error(json.error?.message || "Google Ads no entregó las cifras");
  }
  return sumarMetricasAds(json.results ?? [], cuenta.currency);
}
