import { describe, expect, it } from "vitest";

import type { EtapaEmbudo, Prospecto } from "@/types/isapre";

import { agruparPorEtapa, contarPorEtapa, intercambiarOrden, siguienteOrden, totalesEmbudo } from "./embudo";

const etapa = (id: string, orden: number): EtapaEmbudo => ({ id, nombre: id, orden, tipo: "abierta" });
const ETAPAS = [etapa("b", 2), etapa("a", 1), etapa("c", 3)];

describe("embudo", () => {
  it("agrupa prospectos respetando el orden de las etapas", () => {
    const p = { id: "p1", etapaId: "b" } as Prospecto;
    const grupos = agruparPorEtapa(ETAPAS, [p]);
    expect(grupos.map((g) => [g.etapa.id, g.prospectos.length])).toEqual([
      ["a", 0],
      ["b", 1],
      ["c", 0],
    ]);
  });

  it("intercambia el orden con la etapa vecina", () => {
    expect(intercambiarOrden(ETAPAS, "b", -1).map((e) => [e.id, e.orden])).toEqual([
      ["b", 1],
      ["a", 2],
    ]);
    expect(intercambiarOrden(ETAPAS, "a", -1)).toEqual([]);
    expect(intercambiarOrden(ETAPAS, "c", 1)).toEqual([]);
  });

  it("cuenta prospectos por etapa y por tipo", () => {
    const etapas: EtapaEmbudo[] = [
      { id: "a", nombre: "Nuevo", orden: 1, tipo: "abierta" },
      { id: "g", nombre: "Cerrado", orden: 2, tipo: "ganada" },
      { id: "p", nombre: "Perdido", orden: 3, tipo: "perdida" },
    ];
    const prospectos = [{ etapaId: "a" }, { etapaId: "a" }, { etapaId: "g" }] as Prospecto[];
    const conteo = contarPorEtapa(etapas, prospectos);
    expect(conteo.map((c) => c.cantidad)).toEqual([2, 1, 0]);
    expect(totalesEmbudo(conteo)).toEqual({ total: 3, abiertos: 2, cerrados: 1, perdidos: 0 });
  });

  it("calcula el siguiente orden", () => {
    expect(siguienteOrden(ETAPAS)).toBe(4);
    expect(siguienteOrden([])).toBe(1);
  });
});
