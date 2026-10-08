import type { TipoEtapa } from "@/types/isapre";

export interface EtapaMeta {
  id: string;
  tipo: TipoEtapa;
}

export interface CierreProspecto {
  etapaId: string;
  cerradoEn: string | null;
  ufCierre: number | null;
}

export interface AvanceMes {
  contratos: number;
  uf: number;
}

/** Prospectos en etapa ganada cuya fecha de cierre cae en `mes` (YYYY-MM). */
export function avanceMes(prospectos: CierreProspecto[], etapas: EtapaMeta[], mes: string): AvanceMes {
  const ganadas = new Set(etapas.filter((e) => e.tipo === "ganada").map((e) => e.id));
  const delMes = prospectos.filter(
    (p) => ganadas.has(p.etapaId) && p.cerradoEn != null && p.cerradoEn.slice(0, 7) === mes,
  );
  return {
    contratos: delMes.length,
    uf: delMes.reduce((suma, p) => suma + (p.ufCierre ?? 0), 0),
  };
}

export function porcentajeMeta(actual: number, meta: number | null): number | null {
  if (meta === null || meta <= 0) return null;
  return Math.min(100, (actual / meta) * 100);
}

/** Al entrar a una etapa ganada fija el cierre en `hoy`; al salir lo borra. `null` si no cambia. */
export function cierreAlCambiarEtapa(
  anterior: CierreProspecto,
  etapaIdNueva: string,
  etapas: EtapaMeta[],
  hoy: string,
): Pick<CierreProspecto, "cerradoEn" | "ufCierre"> | null {
  if (anterior.etapaId === etapaIdNueva) return null;
  const origen = etapas.find((e) => e.id === anterior.etapaId);
  const destino = etapas.find((e) => e.id === etapaIdNueva);
  if (!origen || !destino || origen.tipo === destino.tipo) return null;
  if (destino.tipo === "ganada") return { cerradoEn: hoy, ufCierre: anterior.ufCierre };
  if (origen.tipo === "ganada") return { cerradoEn: null, ufCierre: null };
  return null;
}

export function cierreAlCrear(etapaId: string, etapas: EtapaMeta[], hoy: string): string | null {
  return etapas.find((e) => e.id === etapaId)?.tipo === "ganada" ? hoy : null;
}
