import * as XLSX from "xlsx";

function esExcel(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 4));
  const zip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  const ole = bytes[0] === 0xd0 && bytes[1] === 0xcf;
  return zip || ole;
}

function textoCsv(buffer: ArrayBuffer): string {
  const utf8 = new TextDecoder("utf-8").decode(buffer);
  return utf8.includes("\uFFFD") ? new TextDecoder("windows-1252").decode(buffer) : utf8;
}

function tabla(libro: XLSX.WorkBook): unknown[][] {
  const nombre = libro.SheetNames[0];
  if (!nombre) return [];
  const hoja = libro.Sheets[nombre];
  if (!hoja) return [];
  return XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, raw: true, defval: null });
}

/** Primera hoja de un CSV, XLS o XLSX, como filas de celdas. */
export function filasDesdeArchivo(buffer: ArrayBuffer): unknown[][] {
  if (esExcel(buffer)) return tabla(XLSX.read(buffer, { type: "array" }));
  return tabla(XLSX.read(textoCsv(buffer), { type: "string" }));
}
