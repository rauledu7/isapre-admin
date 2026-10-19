import { describe, expect, it } from "vitest";

import type { TarifarioGuardado } from "./supabase/tarifarios";
import { combinarTarifarios, puedeEscribirTarifario } from "./tarifariosCuenta";

function tarifa(isapreId: TarifarioGuardado["isapreId"], codigo: string): TarifarioGuardado {
  return { isapreId, titulo: codigo, planes: [], productos: [] };
}

describe("combinarTarifarios", () => {
  it("el del asesor tapa al común y el quitado no vuelve", () => {
    const lista = combinarTarifarios(
      [tarifa("colmena", "propio")],
      [tarifa("colmena", "comun"), tarifa("banmedica", "comun"), tarifa("esencial", "comun")],
      ["esencial"],
    );
    expect(lista.map((item) => `${item.isapreId}:${item.titulo}`)).toEqual(["colmena:propio", "banmedica:comun"]);
  });
});

describe("puedeEscribirTarifario", () => {
  it("el Full carga uno nuevo y el Profesional solo reemplaza", () => {
    expect(puedeEscribirTarifario("full", false)).toBe(true);
    expect(puedeEscribirTarifario("intermedio", true)).toBe(true);
    expect(puedeEscribirTarifario("intermedio", false)).toBe(false);
    expect(puedeEscribirTarifario("basico", true)).toBe(false);
  });
});
