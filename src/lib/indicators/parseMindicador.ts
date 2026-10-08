import type { ValorUF } from "@/types/isapre";

const fechaChile = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function parseRespuestaUF(data: unknown): ValorUF {
  const serie = (data as { serie?: unknown } | null)?.serie;
  if (!Array.isArray(serie) || serie.length === 0) {
    throw new Error("Respuesta de mindicador.cl sin serie de UF");
  }

  const { valor, fecha } = serie[0] as { valor?: unknown; fecha?: unknown };
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor <= 0) {
    throw new Error("Valor UF inválido en respuesta de mindicador.cl");
  }
  const instante = typeof fecha === "string" ? new Date(fecha) : null;
  if (!instante || Number.isNaN(instante.getTime())) {
    throw new Error("Fecha UF inválida en respuesta de mindicador.cl");
  }

  return { valor, fecha: fechaChile.format(instante), fuente: "mindicador" };
}
