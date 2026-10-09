import "server-only";

import type { CuentaGoogleAds } from "@/lib/cuentaGoogleAds";

import type { Supabase } from "./client";

type Fila = {
  developer_token: string;
  client_id: string;
  client_secret: string;
  refresh_token: string;
  customer_id: string;
  login_customer_id: string | null;
  conversion_action_id: string;
  currency: string;
  api_version: string;
};

function aCuenta(fila: Fila): CuentaGoogleAds {
  return {
    developerToken: fila.developer_token,
    clientId: fila.client_id,
    clientSecret: fila.client_secret,
    refreshToken: fila.refresh_token,
    customerId: fila.customer_id,
    loginCustomerId: fila.login_customer_id,
    conversionActionId: fila.conversion_action_id,
    currency: fila.currency,
    apiVersion: fila.api_version,
  };
}

export async function obtenerCuentaGoogleAds(sb: Supabase): Promise<CuentaGoogleAds | null> {
  const { data, error } = await sb.from("google_ads_cuentas").select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return data ? aCuenta(data) : null;
}

export async function guardarCuentaGoogleAds(sb: Supabase, asesorId: string, cuenta: CuentaGoogleAds): Promise<void> {
  const { error } = await sb.from("google_ads_cuentas").upsert(
    {
      asesor_id: asesorId,
      developer_token: cuenta.developerToken,
      client_id: cuenta.clientId,
      client_secret: cuenta.clientSecret,
      refresh_token: cuenta.refreshToken,
      customer_id: cuenta.customerId,
      login_customer_id: cuenta.loginCustomerId,
      conversion_action_id: cuenta.conversionActionId,
      currency: cuenta.currency,
      api_version: cuenta.apiVersion,
    },
    { onConflict: "asesor_id" },
  );
  if (error) throw new Error(error.message);
}
