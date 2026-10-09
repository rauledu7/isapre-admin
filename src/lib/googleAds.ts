import type { CuentaGoogleAds } from "@/lib/cuentaGoogleAds";

export interface MetricaGoogle {
  nombre: string;
  clics: number;
  gasto: number;
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

export async function metricasCampanas(cuenta: CuentaGoogleAds): Promise<MetricaGoogle[] | null> {
  const id = cuenta.customerId;
  const token = await accessToken(cuenta);
  const respuesta = await fetch(`https://googleads.googleapis.com/${cuenta.apiVersion}/customers/${id}/googleAds:search`, {
    method: "POST",
    headers: headers(cuenta, token),
    body: JSON.stringify({
      query:
        "SELECT campaign.name, metrics.clicks, metrics.cost_micros FROM campaign WHERE segments.date DURING THIS_MONTH",
    }),
  });
  if (!respuesta.ok) return null;
  const json = (await respuesta.json()) as {
    results?: { campaign?: { name?: string }; metrics?: { clicks?: string; costMicros?: string } }[];
  };
  const porNombre = new Map<string, MetricaGoogle>();
  for (const fila of json.results ?? []) {
    const nombre = fila.campaign?.name?.trim();
    if (!nombre) continue;
    const actual = porNombre.get(nombre) ?? { nombre, clics: 0, gasto: 0 };
    actual.clics += Number(fila.metrics?.clicks ?? 0);
    actual.gasto += Number(fila.metrics?.costMicros ?? 0) / 1_000_000;
    porNombre.set(nombre, actual);
  }
  return [...porNombre.values()];
}
