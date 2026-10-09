/** Origen https de una página de leads, sin ruta. Vacío significa que el asesor no tiene web. */
export function normalizarSitio(valor: string): string | null {
  const limpio = valor.trim();
  if (!limpio) return null;
  const conProtocolo = /^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`;
  let url: URL;
  try {
    url = new URL(conProtocolo);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password || url.search || url.hash) return null;
  if (url.pathname !== "/" && url.pathname !== "") return null;
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (!host.includes(".") || host.startsWith(".") || host.endsWith(".")) return null;
  return `https://${host}`;
}

export function mismoSitio(origen: string | null, sitio: string): boolean {
  if (!origen) return true;
  const a = normalizarSitio(origen);
  const b = normalizarSitio(sitio);
  return Boolean(a && b && a === b);
}

function textoCorto(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const limpio = valor.trim();
  return limpio ? limpio.slice(0, 120) : null;
}

export function detalleFormularioWeb(body: unknown): { renta: string | null; cargas: string | null } {
  if (!body || typeof body !== "object") return { renta: null, cargas: null };
  const fila = body as Record<string, unknown>;
  return { renta: textoCorto(fila.renta), cargas: textoCorto(fila.cargas) };
}

/** Nota inicial: el sueldo del formulario es un tramo, no la renta imponible. */
export function notaLeadWeb(entrada: { sitio: string; renta: string | null; cargas: string | null }): string {
  const lineas = ["Por contactar. Llegó desde la web.", `Sitio: ${entrada.sitio}`];
  if (entrada.renta) lineas.push(`Sueldo líquido: ${entrada.renta}`);
  if (entrada.cargas) lineas.push(`Cargas: ${entrada.cargas}`);
  return lineas.join("\n");
}
