import { describe, expect, it } from "vitest";

import { avanceMes, cierreAlCambiarEtapa, cierreAlCrear, porcentajeMeta } from "./metas";

const ETAPAS = [
  { id: "abierta", tipo: "abierta" as const },
  { id: "ganada", tipo: "ganada" as const },
  { id: "perdida", tipo: "perdida" as const },
];

describe("avanceMes", () => {
  const prospectos = [
    { etapaId: "ganada", cerradoEn: "2026-10-02", ufCierre: 3.2 },
    { etapaId: "ganada", cerradoEn: "2026-10-20", ufCierre: null },
    { etapaId: "ganada", cerradoEn: "2026-09-30", ufCierre: 5 },
    { etapaId: "abierta", cerradoEn: "2026-10-01", ufCierre: 9 },
  ];

  it("suma solo los cierres del mes que siguen en etapa ganada", () => {
    expect(avanceMes(prospectos, ETAPAS, "2026-10")).toEqual({ contratos: 2, uf: 3.2 });
  });
});

describe("cierre de etapa", () => {
  const abierto = { etapaId: "abierta", cerradoEn: null, ufCierre: null };

  it("fija la fecha al entrar a ganada y la borra al salir", () => {
    expect(cierreAlCambiarEtapa(abierto, "ganada", ETAPAS, "2026-10-08")).toEqual({
      cerradoEn: "2026-10-08",
      ufCierre: null,
    });
    expect(
      cierreAlCambiarEtapa(
        { etapaId: "ganada", cerradoEn: "2026-10-08", ufCierre: 4 },
        "perdida",
        ETAPAS,
        "2026-10-09",
      ),
    ).toEqual({ cerradoEn: null, ufCierre: null });
  });

  it("no toca el cierre si la etapa nueva es del mismo tipo", () => {
    expect(cierreAlCambiarEtapa(abierto, "abierta", ETAPAS, "2026-10-08")).toBeNull();
    expect(cierreAlCrear("ganada", ETAPAS, "2026-10-08")).toBe("2026-10-08");
    expect(cierreAlCrear("abierta", ETAPAS, "2026-10-08")).toBeNull();
  });
});

describe("porcentajeMeta", () => {
  it("no calcula porcentaje sin meta positiva", () => {
    expect(porcentajeMeta(2, null)).toBeNull();
    expect(porcentajeMeta(2, 0)).toBeNull();
  });

  it("topa el avance en 100", () => {
    expect(porcentajeMeta(3, 10)).toBe(30);
    expect(porcentajeMeta(12, 10)).toBe(100);
  });
});
