import { describe, expect, it } from "vitest";

import { revisarImportacion } from "./importacion";

const etapas = [
  { id: "nuevo", nombre: "Nuevo", orden: 1, tipo: "abierta" as const },
  { id: "cerrado", nombre: "Cerrado (afiliado)", orden: 0, tipo: "ganada" as const },
];

const encabezado = ["Nombre", "RUT", "Teléfono", "Email", "Renta imponible", "Isapre actual", "Cargas", "Etapa inicial"];

function revisar(filas: unknown[][], ruts: string[] = []) {
  return revisarImportacion(filas, etapas, new Set(ruts));
}

describe("revisarImportacion", () => {
  it("acepta una fila completa y usa la etapa de menor orden si viene vacía", () => {
    const informe = revisar([
      encabezado,
      ["Ana Pérez", "12.345.678-5", "9 1234 5678", "ana@correo.cl", "1.500.000", "Banmédica", "4, 12", ""],
    ]);
    expect(informe.ok).toBe(true);
    if (!informe.ok) return;
    expect(informe.omitidas).toEqual([]);
    expect(informe.listas).toHaveLength(1);
    expect(informe.listas[0]?.datos).toMatchObject({
      nombre: "Ana Pérez",
      rut: "12345678-5",
      telefono: "+56912345678",
      email: "ana@correo.cl",
      rentaImponibleCLP: 1500000,
      isapreActual: "banmedica",
      cargas: [4, 12],
      etapaId: "cerrado",
      edad: null,
    });
  });

  it("omite filas sin nombre o teléfono, con RUT inválido y duplicados", () => {
    const informe = revisar(
      [
        encabezado,
        ["", "", "", "", "", "", "", ""],
        ["", "12.345.678-5", "912345678", "", "", "", "", ""],
        ["Luis", "12.345.678-9", "", "", "", "", "", ""],
        ["Marta", "11.111.111-1", "+56 9 8765 4321", "", "", "Isapre Inventada", "no", "No existe"],
        ["Ana", "12.345.678-5", "912345678", "", "", "", "", "Nuevo"],
        ["Ana otra", "12.345.678-5", "912345679", "", "", "", "", ""],
      ],
      ["11111111-1"],
    );
    expect(informe.ok).toBe(true);
    if (!informe.ok) return;
    expect(informe.listas.map((fila) => fila.datos.nombre)).toEqual(["Ana"]);
    expect(informe.listas[0]?.datos.etapaId).toBe("nuevo");
    expect(informe.omitidas.map((fila) => [fila.fila, fila.motivo])).toEqual([
      [3, "Falta el nombre"],
      [4, "Falta el teléfono. RUT inválido"],
      [5, "Isapre desconocida. Cargas inválidas: edades separadas por coma. Etapa desconocida. Ya existe un prospecto con este RUT"],
      [7, "RUT repetido en el archivo"],
    ]);
  });

  it("rechaza el archivo si no están las columnas obligatorias", () => {
    expect(revisar([["Nombre", "Teléfono"], ["Ana", "912345678"]])).toEqual({
      ok: false,
      error: "Falta la columna RUT. Sin RUT no se puede crear el prospecto.",
    });
    expect(revisar([["RUT", "Email"], ["12.345.678-5", "a@b.cl"]])).toEqual({
      ok: false,
      error: "No encontré las columnas Nombre y Teléfono. Ponlas en la primera fila.",
    });
  });

  it("pide una etapa antes de revisar filas", () => {
    expect(revisarImportacion([encabezado], [], new Set())).toEqual({
      ok: false,
      error: "Crea al menos una etapa antes de importar.",
    });
  });
});
