import { connection } from "next/server";

import { obtenerValorUFOpcional } from "@/lib/indicators/uf";

import { UFIndicator } from "./UFIndicator";

export async function UFOficial() {
  await connection();
  const uf = await obtenerValorUFOpcional();
  return <UFIndicator ufOficial={uf} />;
}
