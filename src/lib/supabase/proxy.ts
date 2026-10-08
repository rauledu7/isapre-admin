import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

import { supabaseEnv } from "./env";

const RUTAS_PUBLICAS = ["/login"];

/** Refresca la sesión en cada request y redirige según autenticación. */
export async function actualizarSesion(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnv();

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
  const { pathname, search } = request.nextUrl;
  const esPublica = RUTAS_PUBLICAS.some((r) => pathname.startsWith(r));

  const redirigir = (destino: URL) => {
    const redireccion = NextResponse.redirect(destino);
    response.cookies.getAll().forEach((c) => redireccion.cookies.set(c));
    return redireccion;
  };

  if (!autenticado && !esPublica) {
    const destino = new URL("/login", request.url);
    destino.searchParams.set("next", `${pathname}${search}`);
    return redirigir(destino);
  }
  if (autenticado && esPublica) {
    return redirigir(new URL("/", request.url));
  }
  return response;
}
