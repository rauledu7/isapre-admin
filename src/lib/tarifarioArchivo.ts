import "server-only";

import { extractTextItems, getDocumentProxy } from "unpdf";
import * as XLSX from "xlsx";

import { ISAPRES } from "@/config/isapres";
import { leerTarifario, type PalabraTarifa, type TarifarioLeido } from "@/lib/tarifario";
import { leerTarifarioMasvida } from "@/lib/tarifarioMasvida";
import type { IsapreId } from "@/types/isapre";

const MAX_BYTES = 8 * 1024 * 1024;

export function esIsapre(valor: string): valor is IsapreId {
  return ISAPRES.some((isapre) => isapre.id === valor);
}

function esExcel(archivo: File): boolean {
  const nombre = archivo.name.toLowerCase();
  return (
    nombre.endsWith(".xlsx") ||
    nombre.endsWith(".xls") ||
    archivo.type.includes("spreadsheet") ||
    archivo.type.includes("excel")
  );
}

async function leerPdf(archivo: File): Promise<TarifarioLeido> {
  const pdf = await getDocumentProxy(new Uint8Array(await archivo.arrayBuffer()));
  const { items } = await extractTextItems(pdf);
  const paginas: PalabraTarifa[][] = [];
  for (let i = 0; i < items.length; i++) {
    const palabras = items[i];
    if (!palabras) continue;
    const pagina = await pdf.getPage(i + 1);
    const altura = pagina.getViewport({ scale: 1 }).height;
    paginas.push(
      palabras
        .filter((item) => item.str.trim())
        .map((item) => ({
          texto: item.str.trim(),
          x: item.x,
          y: altura - item.y - item.height,
        })),
    );
  }
  return leerTarifario(paginas);
}

function leerExcel(buffer: ArrayBuffer): TarifarioLeido {
  const libro = XLSX.read(buffer, { type: "array" });
  return leerTarifarioMasvida(
    libro.SheetNames.flatMap((nombre) => {
      const hoja = libro.Sheets[nombre];
      if (!hoja) return [];
      return [{ nombre, filas: XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, raw: true, defval: null }) }];
    }),
  );
}

export async function leerArchivoTarifario(
  isapreId: string,
  archivo: FormDataEntryValue | null,
): Promise<{ ok: true; isapreId: IsapreId; leido: TarifarioLeido } | { ok: false; error: string; status: number }> {
  if (!esIsapre(isapreId)) return { ok: false, error: "Elige la Isapre del tarifario.", status: 400 };
  if (!(archivo instanceof File) || archivo.size === 0 || archivo.size > MAX_BYTES) {
    return { ok: false, error: "Adjunta el tarifario, de hasta 8 MB.", status: 400 };
  }

  const excel = isapreId === "nueva-masvida";
  if (excel && !esExcel(archivo)) {
    return { ok: false, error: "Nueva Masvida se carga con el Excel del tarifario.", status: 400 };
  }
  if (!excel && archivo.type && archivo.type !== "application/pdf" && !archivo.name.toLowerCase().endsWith(".pdf")) {
    return { ok: false, error: "Esta Isapre se carga con el PDF del tarifario.", status: 400 };
  }

  let leido: TarifarioLeido;
  try {
    leido = excel ? leerExcel(await archivo.arrayBuffer()) : await leerPdf(archivo);
  } catch {
    return { ok: false, error: excel ? "No pude abrir ese Excel." : "No pude abrir ese PDF.", status: 422 };
  }
  if (leido.planes.length === 0) {
    return { ok: false, error: "No encontré planes con precio base en ese archivo.", status: 422 };
  }
  return { ok: true, isapreId, leido };
}
