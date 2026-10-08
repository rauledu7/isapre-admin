import { obtenerValorUFOpcional } from "@/lib/indicators/uf";

import { UFIndicator } from "./UFIndicator";

export async function UFOficial() {
  const uf = await obtenerValorUFOpcional();
  return <UFIndicator ufOficial={uf} />;
}
