import { describe, expect, it } from "vitest";

import { leerTarifarioMasvida } from "./tarifarioMasvida";

describe("leerTarifarioMasvida", () => {
  it("toma el precio base de cada línea y no duplica hospitalario con ambulatorio", () => {
    const leido = leerTarifarioMasvida([
      {
        nombre: "Pleno",
        filas: [
          ["PLENO LIBRE ELECCION HOSPITALARIO", "", "", "PLENO LIBRE ELECCION AMBULATORIO"],
          ["Plan", "PB", "% Bonificación", "Plan", "PB"],
          ["UF", "VA"],
          ["PLEN249", 1.93, "90%", "PLEN249", 1.93],
          ["PLEN250", "2,04", "90%", "PLEN250", "2,04"],
        ],
      },
      {
        nombre: "Pleno Salud",
        filas: [["Plan", "PB", "PLENO SALUD HOSPITALARIO"], ["PS260900", 1.28, "50%"]],
      },
    ]);

    expect(leido.productos).toEqual([]);
    expect(leido.planes).toEqual([
      { codigo: "PLEN249", linea: "PLENO LIBRE ELECCION", precioBaseUF: 1.93, consultaUF: null },
      { codigo: "PLEN250", linea: "PLENO LIBRE ELECCION", precioBaseUF: 2.04, consultaUF: null },
      { codigo: "PS260900", linea: "PLENO SALUD", precioBaseUF: 1.28, consultaUF: null },
    ]);
  });

  it("ignora el GES y la tabla de factores del resumen", () => {
    const leido = leerTarifarioMasvida([
      {
        nombre: "Resumen",
        filas: [
          ["", "", "", "", "", "", "", "", "LINEAS LIBRE ELECCION Y PREFERENTES SANTIAGO"],
          ["TRAMOS EDAD", "TITULAR", "", "CARGA", "", "", "", "", "Plan", "PB"],
          ["0 a menos de 20 años", 0.6, "", 0.6],
          ["", "GES", 0.854, "", "", "", "", "", "PLEN261", 3.6],
        ],
      },
    ]);

    expect(leido.titulo).toMatch(/LIBRE ELECCION/i);
    expect(leido.planes).toEqual([
      { codigo: "PLEN261", linea: "LINEAS LIBRE ELECCION Y PREFERENTES SANTIAGO", precioBaseUF: 3.6, consultaUF: null },
    ]);
  });
});
