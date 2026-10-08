import type { EtapaEmbudo, Prospecto } from "@/types/isapre";

export function agruparPorEtapa(
  etapas: EtapaEmbudo[],
  prospectos: Prospecto[],
): { etapa: EtapaEmbudo; prospectos: Prospecto[] }[] {
  return [...etapas]
    .sort((a, b) => a.orden - b.orden)
    .map((etapa) => ({ etapa, prospectos: prospectos.filter((p) => p.etapaId === etapa.id) }));
}

/** Intercambia la etapa con su vecina; devuelve solo las etapas cuyo `orden` cambió. */
export function intercambiarOrden(
  etapas: EtapaEmbudo[],
  id: string,
  direccion: -1 | 1,
): EtapaEmbudo[] {
  const ordenadas = [...etapas].sort((a, b) => a.orden - b.orden);
  const i = ordenadas.findIndex((e) => e.id === id);
  const a = ordenadas[i];
  const b = ordenadas[i + direccion];
  if (i < 0 || !a || !b) return [];
  return [
    { ...a, orden: b.orden },
    { ...b, orden: a.orden },
  ];
}

export interface ConteoEtapa {
  etapaId: string;
  nombre: string;
  tipo: EtapaEmbudo["tipo"];
  cantidad: number;
}

export function contarPorEtapa(etapas: EtapaEmbudo[], prospectos: Prospecto[]): ConteoEtapa[] {
  return agruparPorEtapa(etapas, prospectos).map(({ etapa, prospectos: lista }) => ({
    etapaId: etapa.id,
    nombre: etapa.nombre,
    tipo: etapa.tipo,
    cantidad: lista.length,
  }));
}

export interface TotalesEmbudo {
  total: number;
  abiertos: number;
  cerrados: number;
  perdidos: number;
}

export function totalesEmbudo(conteos: ConteoEtapa[]): TotalesEmbudo {
  return conteos.reduce<TotalesEmbudo>(
    (acc, c) => {
      acc.total += c.cantidad;
      if (c.tipo === "ganada") acc.cerrados += c.cantidad;
      else if (c.tipo === "perdida") acc.perdidos += c.cantidad;
      else acc.abiertos += c.cantidad;
      return acc;
    },
    { total: 0, abiertos: 0, cerrados: 0, perdidos: 0 },
  );
}

export function siguienteOrden(etapas: EtapaEmbudo[]): number {
  return etapas.reduce((max, e) => Math.max(max, e.orden), 0) + 1;
}
