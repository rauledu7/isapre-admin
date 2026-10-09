import "server-only";

import https from "node:https";

import { cacheLife } from "next/cache";

import type { ValorUF } from "@/types/isapre";

import { parseRespuestaUF } from "./parseMindicador";

/** mindicador.cl a veces no responde en la raíz. www y el espejo publican la misma UF. */
const FUENTES_UF = ["https://www.mindicador.cl/api/uf", "https://indicadoreschile.cl/data/hoy.json"];
const ESPERA_MS = 8000;

function leerJSON(url: string): Promise<unknown | null> {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      { family: 4, headers: { accept: "application/json" } },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          if ((res.statusCode ?? 500) >= 400) {
            resolve(null);
            return;
          }
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
          } catch {
            resolve(null);
          }
        });
      },
    );
    req.setTimeout(ESPERA_MS, () => {
      req.destroy();
      resolve(null);
    });
    req.on("error", () => resolve(null));
  });
}

async function desde(url: string): Promise<ValorUF> {
  const data = await leerJSON(url);
  if (!data) throw new Error(`sin respuesta de ${url}`);
  return parseRespuestaUF(data);
}

/** UF del día. Lanza error si ninguna fuente responde: el llamador ofrece ingreso manual. */
export async function obtenerValorUF(): Promise<ValorUF> {
  "use cache";
  cacheLife("hours");

  try {
    return await Promise.any(FUENTES_UF.map((url) => desde(url)));
  } catch {
    throw new Error("No se pudo obtener la UF del día");
  }
}

export async function obtenerValorUFOpcional(): Promise<ValorUF | null> {
  try {
    return await obtenerValorUF();
  } catch (error) {
    console.error("No se pudo obtener la UF del día", error);
    return null;
  }
}
