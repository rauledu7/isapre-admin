import type { IsapreId } from "@/types/isapre";

import type { Supabase } from "./client";
import { ErrorDatos } from "./prospectos";

export async function listarGesIsapres(sb: Supabase): Promise<Partial<Record<IsapreId, number>>> {
  const { data, error } = await sb.from("ges_isapres").select("isapre_id, ges_uf");
  if (error?.code === "42P01" || error?.code === "PGRST205") return {};
  if (error) throw new ErrorDatos(`No se pudo cargar el GES: ${error.message}`);

  const ges: Partial<Record<IsapreId, number>> = {};
  for (const fila of data ?? []) {
    const valor = typeof fila.ges_uf === "number" ? fila.ges_uf : Number(fila.ges_uf);
    if (Number.isFinite(valor)) ges[fila.isapre_id as IsapreId] = valor;
  }
  return ges;
}
