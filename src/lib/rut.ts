/** Dígito verificador (módulo 11) para el cuerpo numérico del RUT. */
export function calcularDV(cuerpo: number): string {
  let suma = 0;
  let multiplicador = 2;
  for (let n = cuerpo; n > 0; n = Math.floor(n / 10)) {
    suma += (n % 10) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  return resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
}

/** Normaliza a "12345678-5" si el RUT es válido; `null` si no. */
export function normalizarRut(valor: string): string | null {
  const limpio = valor.replace(/[.\s-]/g, "").toUpperCase();
  const match = /^(\d{1,8})([\dK])$/.exec(limpio);
  if (!match) return null;
  const cuerpo = Number(match[1]);
  if (cuerpo === 0 || calcularDV(cuerpo) !== match[2]) return null;
  return `${cuerpo}-${match[2]}`;
}

/** "12345678-5" → "12.345.678-5". */
export function formatearRut(rutNormalizado: string): string {
  const [cuerpo, dv] = rutNormalizado.split("-");
  return `${Number(cuerpo).toLocaleString("es-CL")}-${dv}`;
}
