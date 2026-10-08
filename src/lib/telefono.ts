/** Normaliza un teléfono chileno a "+56XXXXXXXXX" (9 dígitos nacionales); `null` si no es válido. */
export function normalizarTelefono(valor: string): string | null {
  const digitos = valor.replace(/\D/g, "");
  const nacional = digitos.length === 11 && digitos.startsWith("56") ? digitos.slice(2) : digitos;
  return /^\d{9}$/.test(nacional) ? `+56${nacional}` : null;
}

/** "+56912345678" → "+56 9 1234 5678". */
export function formatearTelefono(normalizado: string): string {
  const n = normalizado.slice(3);
  return `+56 ${n.slice(0, 1)} ${n.slice(1, 5)} ${n.slice(5)}`;
}
