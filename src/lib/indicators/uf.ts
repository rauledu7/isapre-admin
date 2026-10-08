import "server-only";

import { cacheLife } from "next/cache";

import type { ValorUF } from "@/types/isapre";

import { parseRespuestaUF } from "./parseMindicador";

const MINDICADOR_UF_URL = "https://mindicador.cl/api/uf";

/** UF del día desde mindicador.cl. Lanza error si el servicio falla: el llamador debe ofrecer ingreso manual. */
export async function obtenerValorUF(): Promise<ValorUF> {
  "use cache";
  cacheLife("hours");

  const res = await fetch(MINDICADOR_UF_URL, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`mindicador.cl respondió ${res.status}`);
  }
  return parseRespuestaUF(await res.json());
}
