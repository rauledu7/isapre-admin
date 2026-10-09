import { describe, expect, it } from "vitest";

import { leerPlanPdf } from "./planPdf";

const BANMEDICA = `
Plan de salud complementario modalidad prestador cerrado
Salud Conecta Clásico 22/2601
BSCC260122
%Cotización LegalUFPrecio Base
PRECIO DEL PLAN DE SALUD COMPLEMENTARIO
Contáctanos de manera simple y rápida banmedica.cl
`;

describe("leerPlanPdf", () => {
  it("toma nombre, código e Isapre cuando el precio base viene vacío", () => {
    expect(leerPlanPdf(BANMEDICA)).toEqual({
      nombre: "Salud Conecta Clásico 22/2601",
      codigo: "BSCC260122",
      isapreId: "banmedica",
      precioBaseUF: null,
    });
  });

  it("toma el precio base cuando la casilla trae un monto", () => {
    const texto = BANMEDICA.replace("UFPrecio Base", "UFPrecio Base\n2,3456 UF");
    expect(leerPlanPdf(texto).precioBaseUF).toBe(2.3456);
  });

  it("no elige Isapre si el texto nombra a más de una", () => {
    expect(leerPlanPdf(`${BANMEDICA}\nIsapre Colmena`).isapreId).toBeNull();
  });
});
