import type { ValorUF } from "@/types/isapre";

const fechaChile = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function puntoUF(data: unknown): { valor?: unknown; fecha?: unknown } | null {
  if (!data || typeof data !== "object") return null;
  const fila = data as { serie?: unknown; uf?: unknown };
  if (Array.isArray(fila.serie) && fila.serie[0] && typeof fila.serie[0] === "object") {
    return fila.serie[0] as { valor?: unknown; fecha?: unknown };
  }
  if (fila.uf && typeof fila.uf === "object") {
    return fila.uf as { valor?: unknown; fecha?: unknown };
  }
  return null;
}

export function parseRespuestaUF(data: unknown): ValorUF {
  const punto = puntoUF(data);
  if (!punto) throw new Error("Respuesta de mindicador.cl sin serie de UF");

  const { valor, fecha } = punto;
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor <= 0) {
    throw new Error("Valor UF inválido en respuesta de mindicador.cl");
  }
  const instante = typeof fecha === "string" ? new Date(fecha) : null;
  if (!instante || Number.isNaN(instante.getTime())) {
    throw new Error("Fecha UF inválida en respuesta de mindicador.cl");
  }

  return { valor, fecha: fechaChile.format(instante), fuente: "mindicador" };
}
