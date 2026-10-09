import { describe, expect, it } from "vitest";

import { filasDesdeArchivo } from "./hoja";

function bufferDe(texto: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(texto);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

describe("filasDesdeArchivo", () => {
  it("lee un CSV en UTF-8 sin partir la columna Teléfono", () => {
    const filas = filasDesdeArchivo(bufferDe("Nombre,Teléfono,RUT\nAna,9 1234 5678,12.345.678-5\n"));
    expect(filas[0]).toEqual(["Nombre", "Teléfono", "RUT"]);
    expect(filas[1]?.[1]).toBe("9 1234 5678");
  });

  it("acepta el CSV separado por punto y coma", () => {
    const filas = filasDesdeArchivo(bufferDe("Nombre;Teléfono\nAna;912345678\n"));
    expect(filas[0]).toEqual(["Nombre", "Teléfono"]);
  });
});
