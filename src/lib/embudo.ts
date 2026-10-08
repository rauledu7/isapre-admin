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
  const j = i + direccion;
  if (i < 0 || j < 0 || j >= ordenadas.length) return [];
  const [a, b] = [ordenadas[i], ordenadas[j]];
  return [
    { ...a, orden: b.orden },
    { ...b, orden: a.orden },
  ];
}

export function siguienteOrden(etapas: EtapaEmbudo[]): number {
  return etapas.reduce((max, e) => Math.max(max, e.orden), 0) + 1;
}
