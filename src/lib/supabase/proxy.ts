import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { hostsConfig, inicioTrasLogin, pasoHost, superficieDe } from "@/lib/hosts";
import { normalizarSitio } from "@/lib/sitioWeb";
import { esSuperAdmin, rutaSuperAdmin } from "@/lib/superAdmin";
import { funcionDeRuta, permite, rutaSinSuscripcion, suscripcionVigente } from "@/lib/suscripcion";
import type { Database } from "@/types/database";

import { supabaseEnv } from "./env";
import { nivelDeSuscripcion, obtenerSuscripcion } from "./suscripciones";

const RUTAS_PUBLICAS = ["/login"];
const RUTAS_ABIERTAS = ["/sw.js", "/api/cron", "/api/v1/leads", "/api/v1/webhooks"];

function corsLeads(origen: string | null): Headers {
  const headers = new Headers();
  if (origen && normalizarSitio(origen)) {
    headers.set("Access-Control-Allow-Origin", origen);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Vary", "Origin");
  }
  return headers;
}

/** Refresca la sesión en cada request y redirige según autenticación. */
export async function actualizarSesion(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  if (pathname === "/api/v1/leads" || pathname.startsWith("/api/v1/leads/")) {
    const headers = corsLeads(request.headers.get("origin"));
    if (request.method === "OPTIONS") return new NextResponse(null, { status: 204, headers });
    const paso = NextResponse.next({ request });
    headers.forEach((valor, nombre) => paso.headers.set(nombre, valor));
    return paso;
  }

  let response = NextResponse.next({ request });
  let url: string;
  let key: string;
  try {
    ({ url, key } = supabaseEnv());
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Falta la configuración de Supabase";
    return new NextResponse(mensaje, { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // getClaims valida el JWT; no ejecutar código entre createServerClient y esta llamada.
  const { data } = await supabase.auth.getClaims();
  const autenticado = Boolean(data?.claims);
  const { search } = request.nextUrl;
  if (RUTAS_ABIERTAS.some((r) => pathname === r || pathname.startsWith(`${r}/`))) return response;

  const redirigir = (destino: URL) => {
    const redireccion = NextResponse.redirect(destino);
    response.cookies.getAll().forEach((c) => redireccion.cookies.set(c));
    return redireccion;
  };

  const hosts = hostsConfig();
  const superficie = superficieDe(request.headers.get("x-forwarded-host") ?? request.headers.get("host"), hosts);
  const paso = pasoHost(superficie, pathname, hosts);
  if (paso.tipo === "reescribir") {
    const url = request.nextUrl.clone();
    url.pathname = paso.pathname;
    const reescrito = NextResponse.rewrite(url);
    response.cookies.getAll().forEach((c) => reescrito.cookies.set(c));
    return reescrito;
  }
  if (paso.tipo === "redirigir") {
    const destino = paso.host
      ? new URL(`https://${paso.host}${paso.pathname}${search}`)
      : new URL(`${paso.pathname}${search}`, request.url);
    return redirigir(destino);
  }
  if (paso.tipo === "bloquear") {
    return new NextResponse("No encontrado", { status: paso.status, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  const esPublica = RUTAS_PUBLICAS.some((r) => pathname.startsWith(r));

  if (!autenticado && !esPublica) {
    const destino = new URL("/login", request.url);
    destino.searchParams.set("next", `${pathname}${search}`);
    return redirigir(destino);
  }
  if (autenticado && esPublica) {
    return redirigir(new URL(inicioTrasLogin(superficie), request.url));
  }
  if (!autenticado) return response;

  if (rutaSuperAdmin(pathname)) {
    if (esSuperAdmin(data?.claims.email)) return response;
    if (!pathname.startsWith("/api/") && hosts.asesores && superficie === "dueno") {
      return redirigir(new URL(`https://${hosts.asesores}/`, request.url));
    }
    if (!pathname.startsWith("/api/")) return redirigir(new URL("/", request.url));
    const prohibido = NextResponse.json({ error: "No autorizado" }, { status: 403 });
    response.cookies.getAll().forEach((c) => prohibido.cookies.set(c));
    return prohibido;
  }
  if (rutaSinSuscripcion(pathname)) return response;

  const bloquear = (status: 402 | 403, error: string) => {
    if (!pathname.startsWith("/api/")) return redirigir(new URL("/suscripcion", request.url));
    const bloqueo = NextResponse.json({ error }, { status });
    response.cookies.getAll().forEach((c) => bloqueo.cookies.set(c));
    return bloqueo;
  };

  const funcion = funcionDeRuta(pathname);
  try {
    const lectura = await obtenerSuscripcion(supabase);
    if (lectura.tablaFalta) return response;
    if (!suscripcionVigente(lectura.suscripcion, new Date())) return bloquear(402, "Tu suscripción no está vigente.");
    if (funcion && !permite(await nivelDeSuscripcion(supabase, lectura), funcion)) {
      return bloquear(403, "Tu plan no incluye esta función.");
    }
  } catch {
    return new NextResponse("No se pudo verificar la suscripción", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  return response;
}
