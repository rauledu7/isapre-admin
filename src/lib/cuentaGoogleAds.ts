export interface CuentaGoogleAds {
  developerToken: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  customerId: string;
  loginCustomerId: string | null;
  conversionActionId: string;
  currency: string;
  apiVersion: string;
}

export interface FormularioCuentaGoogleAds {
  developerToken: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  customerId: string;
  loginCustomerId: string;
  conversionActionId: string;
  currency: string;
  apiVersion: string;
}

export interface VistaCuentaGoogleAds {
  conectada: boolean;
  clientId: string;
  customerId: string;
  loginCustomerId: string;
  conversionActionId: string;
  currency: string;
  apiVersion: string;
  tieneDeveloperToken: boolean;
  tieneClientSecret: boolean;
  tieneRefreshToken: boolean;
}

export type CampoCuenta = keyof FormularioCuentaGoogleAds;
export type ErroresCuenta = Partial<Record<CampoCuenta, string>>;

const VACIA: VistaCuentaGoogleAds = {
  conectada: false,
  clientId: "",
  customerId: "",
  loginCustomerId: "",
  conversionActionId: "",
  currency: "CLF",
  apiVersion: "v21",
  tieneDeveloperToken: false,
  tieneClientSecret: false,
  tieneRefreshToken: false,
};

export function adsConfigurado(cuenta: CuentaGoogleAds | null): cuenta is CuentaGoogleAds {
  if (!cuenta) return false;
  return Boolean(
    cuenta.developerToken &&
      cuenta.clientId &&
      cuenta.clientSecret &&
      cuenta.refreshToken &&
      cuenta.customerId &&
      cuenta.conversionActionId,
  );
}

export function vistaCuenta(cuenta: CuentaGoogleAds | null): VistaCuentaGoogleAds {
  if (!cuenta) return VACIA;
  return {
    conectada: adsConfigurado(cuenta),
    clientId: cuenta.clientId,
    customerId: cuenta.customerId,
    loginCustomerId: cuenta.loginCustomerId ?? "",
    conversionActionId: cuenta.conversionActionId,
    currency: cuenta.currency,
    apiVersion: cuenta.apiVersion,
    tieneDeveloperToken: Boolean(cuenta.developerToken),
    tieneClientSecret: Boolean(cuenta.clientSecret),
    tieneRefreshToken: Boolean(cuenta.refreshToken),
  };
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

export function formularioDesde(body: unknown): FormularioCuentaGoogleAds {
  const fila = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  return {
    developerToken: texto(fila.developerToken),
    clientId: texto(fila.clientId),
    clientSecret: texto(fila.clientSecret),
    refreshToken: texto(fila.refreshToken),
    customerId: texto(fila.customerId),
    loginCustomerId: texto(fila.loginCustomerId),
    conversionActionId: texto(fila.conversionActionId),
    currency: texto(fila.currency),
    apiVersion: texto(fila.apiVersion),
  };
}

function digitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

/** Une el formulario con la cuenta ya guardada. Un secreto vacío conserva el anterior. */
export function fusionarCuenta(
  anterior: CuentaGoogleAds | null,
  form: FormularioCuentaGoogleAds,
): { ok: true; cuenta: CuentaGoogleAds } | { ok: false; errores: ErroresCuenta } {
  const errores: ErroresCuenta = {};
  const developerToken = form.developerToken.trim() || anterior?.developerToken || "";
  const clientSecret = form.clientSecret.trim() || anterior?.clientSecret || "";
  const refreshToken = form.refreshToken.trim() || anterior?.refreshToken || "";
  const clientId = form.clientId.trim();
  const customerId = digitos(form.customerId);
  const loginCustomerId = digitos(form.loginCustomerId);
  const conversionActionId = digitos(form.conversionActionId);
  const currency = (form.currency.trim() || "CLF").toUpperCase();
  const apiVersion = form.apiVersion.trim() || "v21";

  if (!developerToken) errores.developerToken = "Falta el developer token";
  else if (developerToken.length > 200) errores.developerToken = "El developer token es demasiado largo";
  if (!clientId) errores.clientId = "Falta el client ID";
  else if (clientId.length > 255) errores.clientId = "El client ID es demasiado largo";
  if (!clientSecret) errores.clientSecret = "Falta el client secret";
  else if (clientSecret.length > 255) errores.clientSecret = "El client secret es demasiado largo";
  if (!refreshToken) errores.refreshToken = "Falta el refresh token";
  else if (refreshToken.length > 512) errores.refreshToken = "El refresh token es demasiado largo";
  if (!customerId) errores.customerId = "Falta el ID de cliente";
  else if (customerId.length > 20) errores.customerId = "El ID de cliente es demasiado largo";
  if (loginCustomerId.length > 20) errores.loginCustomerId = "El ID de administrador es demasiado largo";
  if (!conversionActionId) errores.conversionActionId = "Falta el ID de la acción de conversión";
  else if (conversionActionId.length > 20) errores.conversionActionId = "El ID de conversión es demasiado largo";
  if (!/^[A-Z]{3}$/.test(currency)) errores.currency = "Usa un código de 3 letras, por ejemplo CLF";
  if (!/^v\d{1,3}$/.test(apiVersion)) errores.apiVersion = "La versión debe verse como v21";

  if (Object.keys(errores).length > 0) return { ok: false, errores };
  return {
    ok: true,
    cuenta: {
      developerToken,
      clientId,
      clientSecret,
      refreshToken,
      customerId,
      loginCustomerId: loginCustomerId || null,
      conversionActionId,
      currency,
      apiVersion,
    },
  };
}
