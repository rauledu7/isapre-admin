import { describe, expect, it } from "vitest";

import type { ClienteForm, PlanForm } from "@/types/cotizador";

import { leerFormulario } from "./cotizadorForm";

const CLIENTE: ClienteForm = {
  rentaImponibleCLP: "1.800.000",
  edadTitular: "38",
  isapreActual: "consalud",
  precioPlanActualUF: "",
};

const PLAN: PlanForm = {
  id: "p1",
  isapreId: "banmedica",
  nombre: "",
  precioBaseUF: "1,85",
  gesUF: "0,6",
  caecUF: "",
  seguroUF: "",
};

describe("leerFormulario", () => {
  it("convierte los textos del formulario a números", () => {
    const r = leerFormulario(CLIENTE, [{ id: "c1", edad: "6" }], [PLAN]);
    if (!r.ok) throw new Error("esperaba ok");
    expect(r.datos).toEqual({
      rentaImponibleCLP: 1_800_000,
      edadTitular: 38,
      edadesCargas: [6],
      precioPlanActualUF: null,
      planes: [
        {
          id: "p1",
          isapreId: "banmedica",
          nombre: "Plan 1",
          precioBaseUF: 1.85,
          gesUF: 0.6,
          caecUF: 0,
          seguroUF: 0,
        },
      ],
    });
    expect(r.planesIncompletos).toEqual([]);
  });

  it("lista los datos faltantes del cliente", () => {
    const r = leerFormulario(
      { ...CLIENTE, rentaImponibleCLP: "", edadTitular: "130", precioPlanActualUF: "abc" },
      [{ id: "c1", edad: "" }],
      [PLAN],
    );
    expect(r).toEqual({
      ok: false,
      faltantes: [
        "Renta imponible (CLP)",
        "Edad del titular",
        "Edad de la carga 1",
        "Precio del plan actual (UF)",
      ],
    });
  });

  it("separa los planes incompletos sin bloquear los válidos", () => {
    const r = leerFormulario(CLIENTE, [], [
      PLAN,
      { ...PLAN, id: "p2", nombre: "Plan Oro", precioBaseUF: "" },
      { ...PLAN, id: "p3", caecUF: "x" },
    ]);
    if (!r.ok) throw new Error("esperaba ok");
    expect(r.datos.planes.map((p) => p.id)).toEqual(["p1"]);
    expect(r.planesIncompletos).toEqual([
      "Plan Oro: falta el precio base en UF",
      "Plan 3: revisa los montos de GES, CAEC o seguros",
    ]);
  });
});
