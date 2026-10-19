import type { TarifarioGuardado } from "@/lib/supabase/tarifarios";
import { permite, type NivelPlan } from "@/lib/suscripcion";

/** El tarifario del asesor tapa al común. Si lo quitó, el común no vuelve. */
export function combinarTarifarios(
  propios: TarifarioGuardado[],
  base: TarifarioGuardado[],
  ocultos: readonly string[],
): TarifarioGuardado[] {
  const escondidos = new Set(ocultos);
  const porIsapre = new Map<string, TarifarioGuardado>();
  for (const item of base) {
    if (!escondidos.has(item.isapreId)) porIsapre.set(item.isapreId, item);
  }
  for (const item of propios) porIsapre.set(item.isapreId, item);
  return [...porIsapre.values()];
}

/** Full carga cualquiera. Los demás solo reemplazan uno que ya está, propio o común. */
export function puedeEscribirTarifario(nivel: NivelPlan, hayBaseOPropio: boolean): boolean {
  if (permite(nivel, "tarifarios")) return true;
  return hayBaseOPropio && permite(nivel, "isapres");
}
