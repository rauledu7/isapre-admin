import type { IsapreId } from "@/types/isapre";

export interface PlanPdf {
  nombre: string | null;
  codigo: string | null;
  isapreId: IsapreId | null;
  /** `null` cuando el PDF deja vacía la casilla Precio Base. */
  precioBaseUF: number | null;
}

const CODIGO = /^[A-Z]{2,8}\d{4,8}$/;

/** Pistas largas primero: "nueva masvida" no debe caer en otra Isapre. */
const PISTAS: { id: IsapreId; pistas: string[] }[] = [
  { id: "nueva-masvida", pistas: ["nuevamasvida.cl", "masvida.cl", "nueva masvida", "nueva mas vida"] },
  { id: "vida-tres", pistas: ["vidatres.cl", "vida tres", "vidatres"] },
  { id: "cruz-blanca", pistas: ["cruzblanca.cl", "cruz blanca", "cruzblanca"] },
  { id: "banmedica", pistas: ["banmedica.cl", "banmedica"] },
  { id: "consalud", pistas: ["consalud.cl", "consalud"] },
  { id: "colmena", pistas: ["colmena.cl", "colmena"] },
  { id: "esencial", pistas: ["esencial.cl", "isapre esencial"] },
];

function fold(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function precioBase(lineas: string[]): number | null {
  const idx = lineas.findIndex((linea) => /precio\s*base/i.test(linea));
  if (idx < 0) return null;
  const ventana = lineas.slice(idx, idx + 3).join(" ");
  const match = ventana.match(/precio\s*base(?:\s+uf)?\s+(\d{1,2}[.,]\d{2,4})\b/i);
  if (!match?.[1]) return null;
  const valor = Number(match[1].replace(",", "."));
  return Number.isFinite(valor) ? valor : null;
}

/** Lee nombre, código, Isapre y precio base del texto de un plan de salud. */
export function leerPlanPdf(texto: string): PlanPdf {
  const lineas = texto
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean);

  let nombre: string | null = null;
  let codigo: string | null = null;
  for (let i = 1; i < lineas.length; i++) {
    const linea = lineas[i];
    if (!linea || !CODIGO.test(linea)) continue;
    const anterior = lineas[i - 1];
    if (!anterior || CODIGO.test(anterior) || anterior.length > 80) continue;
    nombre = anterior;
    codigo = linea;
    break;
  }

  const plano = fold(texto);
  const coinciden = PISTAS.filter((item) => item.pistas.some((pista) => plano.includes(fold(pista))));
  const isapreId = coinciden.length === 1 ? coinciden[0]!.id : null;

  return { nombre, codigo, isapreId, precioBaseUF: precioBase(lineas) };
}
