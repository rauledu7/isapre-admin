import { DECIMALES_UF } from "@/config/isapres";

const ufFormatter = new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: DECIMALES_UF,
  maximumFractionDigits: DECIMALES_UF,
});

const clpFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const enteroFormatter = new Intl.NumberFormat("es-CL", {
  maximumFractionDigits: 0,
});

const factorFormatter = new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

export function formatUF(valor: number): string {
  return `${ufFormatter.format(valor)} UF`;
}

export function formatCLP(valor: number): string {
  return clpFormatter.format(Math.round(valor));
}

export function formatFactor(valor: number): string {
  return factorFormatter.format(valor);
}

/** Formato con separador de miles para inputs de CLP ("1500000" → "1.500.000"). */
export function formatEnteroInput(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  return digitos === "" ? "" : enteroFormatter.format(Number(digitos));
}

/** Entero desde texto con puntos de miles. `null` si está vacío o es inválido. */
export function parseEntero(valor: string): number | null {
  const limpio = valor.replace(/\./g, "").trim();
  if (!/^\d+$/.test(limpio)) return null;
  return Number(limpio);
}

/** Decimal en formato chileno (coma decimal, se acepta punto). `null` si está vacío o es inválido. */
export function parseDecimal(valor: string): number | null {
  const limpio = valor.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(limpio)) return null;
  return Number(limpio);
}

/** Monto estricto es-CL: punto de miles y coma decimal ("41.122,74"). */
export function parseMontoCL(valor: string): number | null {
  return parseDecimal(valor.replace(/\./g, ""));
}
