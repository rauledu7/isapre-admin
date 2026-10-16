export type Superficie = "landing" | "asesores" | "dueno" | "unico";

export interface Hosts {
  landing: string | null;
  asesores: string | null;
  dueno: string | null;
}

export type PasoHost =
  | { tipo: "seguir" }
  | { tipo: "reescribir"; pathname: string }
  | { tipo: "redirigir"; host: string | null; pathname: string }
  | { tipo: "bloquear"; status: 403 | 404 };

function hostLimpio(valor: string | undefined): string | null {
  const host = valor
    ?.trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    ?.split(":")[0]
    ?.replace(/\.$/, "");
  return host || null;
}

export function hostsConfig(): Hosts {
  return {
    landing: hostLimpio(process.env.LANDING_HOST),
    asesores: hostLimpio(process.env.APP_HOST),
    dueno: hostLimpio(process.env.OWNER_HOST),
  };
}

/** Host de la visita, sin puerto. x-forwarded-host puede traer una lista. */
export function hostDe(encabezado: string | null): string {
  return (encabezado ?? "").split(",")[0]?.trim().toLowerCase().replace(/\.$/, "").split(":")[0] ?? "";
}

export function superficieDe(encabezado: string | null, hosts: Hosts): Superficie {
  const host = hostDe(encabezado);
  if (hosts.dueno && host === hosts.dueno) return "dueno";
  if (hosts.asesores && host === hosts.asesores) return "asesores";
  if (hosts.landing && (host === hosts.landing || host === `www.${hosts.landing}`)) return "landing";
  return "unico";
}

function bajo(pathname: string, prefijo: string): boolean {
  return pathname === prefijo || pathname.startsWith(`${prefijo}/`);
}

const RUTAS_DUENO = ["/admin", "/login", "/api/admin"];

/**
 * Qué hacer con la ruta según el host. En `unico` (localhost o Cloud Run, sin dominios)
 * conviven la app y /admin, cada uno con su diseño.
 */
export function pasoHost(superficie: Superficie, pathname: string, hosts: Hosts): PasoHost {
  if (superficie === "landing") {
    if (pathname === "/") return { tipo: "reescribir", pathname: "/inicio" };
    return hosts.asesores
      ? { tipo: "redirigir", host: hosts.asesores, pathname }
      : { tipo: "redirigir", host: null, pathname: "/" };
  }

  if (superficie === "asesores") {
    if (pathname === "/inicio") return { tipo: "redirigir", host: null, pathname: "/" };
    if (bajo(pathname, "/admin") || bajo(pathname, "/api/admin")) {
      return hosts.dueno
        ? { tipo: "redirigir", host: hosts.dueno, pathname: pathname.startsWith("/api/") ? "/admin" : pathname }
        : { tipo: "bloquear", status: 404 };
    }
    return { tipo: "seguir" };
  }

  if (superficie === "dueno") {
    if (pathname === "/" || pathname === "/inicio") return { tipo: "redirigir", host: null, pathname: "/admin" };
    if (RUTAS_DUENO.some((ruta) => bajo(pathname, ruta))) return { tipo: "seguir" };
    if (pathname.startsWith("/api/")) return { tipo: "bloquear", status: 404 };
    return hosts.asesores
      ? { tipo: "redirigir", host: hosts.asesores, pathname }
      : { tipo: "redirigir", host: null, pathname: "/admin" };
  }

  if (pathname === "/inicio") return { tipo: "redirigir", host: null, pathname: "/" };
  return { tipo: "seguir" };
}

export function inicioTrasLogin(superficie: Superficie): string {
  return superficie === "dueno" ? "/admin" : "/";
}
