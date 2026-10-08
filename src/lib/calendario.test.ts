import { describe, expect, it } from "vitest";

import { estaVencido, grillaMes, seguimientosDelDia, seguimientosOrdenados } from "./calendario";

describe("grillaMes", () => {
  it("empieza en lunes e incluye los días fuera de octubre 2026", () => {
    const semanas = grillaMes(2026, 10);
    expect(semanas[0]?.map((d) => d.fecha)).toEqual([
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
    expect(semanas[0]?.[3]?.enMes).toBe(true);
    expect(semanas[0]?.[0]?.enMes).toBe(false);
    expect(semanas.at(-1)?.some((d) => d.fecha === "2026-10-31")).toBe(true);
  });
});

describe("seguimientos", () => {
  const lista = [
    { id: "b", nombre: "Bea", proximoContacto: "2026-10-10" },
    { id: "a", nombre: "Ana", proximoContacto: "2026-10-08" },
    { id: "c", nombre: "Cata", proximoContacto: "2026-10-08" },
  ];

  it("agrupa un día por nombre", () => {
    expect(seguimientosDelDia(lista, "2026-10-08").map((p) => p.id)).toEqual(["a", "c"]);
  });

  it("ordena vencidos antes que los próximos", () => {
    expect(seguimientosOrdenados(lista).map((p) => p.id)).toEqual(["a", "c", "b"]);
    expect(estaVencido("2026-10-08", "2026-10-09")).toBe(true);
    expect(estaVencido("2026-10-09", "2026-10-09")).toBe(false);
  });
});
