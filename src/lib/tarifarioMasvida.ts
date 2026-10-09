import type { PlanTarifa, TarifarioLeido } from "@/lib/tarifario";

export interface HojaMasvida {
  nombre: string;
  filas: unknown[][];
}

const CODIGO = /^[A-Z]{2,8}\d{3,8}$/;

function texto(valor: unknown): string {
  if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
  return typeof valor === "string" ? valor.replace(/\s+/g, " ").trim() : "";
}

function numeroUF(valor: unknown): number | null {
  const numero =
    typeof valor === "number" && Number.isFinite(valor)
      ? valor
      : /^\d{1,2}(\.\d{1,4})?$/.test(texto(valor).replace(",", "."))
        ? Number(texto(valor).replace(",", "."))
        : null;
  if (numero === null || numero <= 0 || numero >= 30) return null;
  return Number(numero.toFixed(4));
}

function lineaDe(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\b(hospitalario|ambulatorio)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function tituloBloque(filas: unknown[][], fila: number, columna: number): string | null {
  const alLado = texto(filas[fila]?.[columna + 2]);
  if (/pleno|libre|salud|max/i.test(alLado)) return lineaDe(alLado);
  const arriba = texto(filas[fila - 1]?.[columna]);
  if (arriba && !/^plan$/i.test(arriba) && arriba.length > 4) return lineaDe(arriba);
  return null;
}

/** Plan y precio base (PB) de las hojas de Nueva Masvida. No lee productos ni la columna LE UF. */
export function leerTarifarioMasvida(hojas: HojaMasvida[]): TarifarioLeido {
  const planes: PlanTarifa[] = [];
  const vistos = new Set<string>();
  let titulo: string | null = null;

  for (const hoja of hojas) {
    titulo ??=
      hoja.filas
        .flat()
        .map(texto)
        .find((celda) => /libre elecci[oó]n/i.test(celda) && celda.length > 15) ?? null;

    hoja.filas.forEach((fila, indice) => {
      fila.forEach((celda, columna) => {
        if (!/^plan$/i.test(texto(celda)) || !/^pb$/i.test(texto(fila[columna + 1]))) return;
        const linea = tituloBloque(hoja.filas, indice, columna) ?? hoja.nombre.toUpperCase();
        for (let i = indice + 1; i < hoja.filas.length; i++) {
          const codigo = texto(hoja.filas[i]?.[columna]).toUpperCase();
          if (!CODIGO.test(codigo) || vistos.has(codigo)) continue;
          const precioBaseUF = numeroUF(hoja.filas[i]?.[columna + 1]);
          if (precioBaseUF === null) continue;
          vistos.add(codigo);
          planes.push({ codigo, linea, precioBaseUF, consultaUF: null });
        }
      });
    });
  }

  return { titulo, planes, productos: [] };
}
