import { ISAPRES } from "@/config/isapres";
import type { ResultadoEvaluacion, ResultadoPlanAlternativa } from "@/lib/calculators/cotizador";
import { ufACLP } from "@/lib/calculators/isapreMath";
import { formatCLP, formatFactor, formatUF, formatValorUF } from "@/lib/format";
import { formatearTelefono } from "@/lib/telefono";
import type { IsapreId, PerfilAsesor, ResultadoDiferencia, ValorUF } from "@/types/isapre";

export const NOTA_LEGAL =
  "Valores referenciales calculados con la UF del día; el precio final lo confirma la Isapre en el FUN.";

export interface Propuesta {
  clienteNombre: string | null;
  isapreActual: IsapreId | null;
  asesor: PerfilAsesor | null;
  valorUF: ValorUF;
  topeImponibleUF: number;
  resultado: ResultadoEvaluacion;
}

export interface LineaMonto {
  etiqueta: string;
  detalle?: string;
  uf: number;
  clp: number;
}

export const nombreIsapre = (id: IsapreId | null): string | null =>
  ISAPRES.find((i) => i.id === id)?.nombre ?? null;

/** "2026-10-08" → "08-10-2026". */
export function formatFechaUF(valorUF: ValorUF): string {
  const [a, m, d] = valorUF.fecha.split("-");
  return `${d}-${m}-${a}`;
}

export function textoValorUF(valorUF: ValorUF): string {
  const origen = valorUF.fuente === "manual" ? "ingresada manualmente" : `del ${formatFechaUF(valorUF)}`;
  return `UF ${formatValorUF(valorUF.valor)} ${origen}`;
}

/** Excedentes o cotización adicional. `null` si el 7% cubre el plan exacto. */
export function lineaDiferencia(d: ResultadoDiferencia): LineaMonto | null {
  if (d.tipo === "excedente") return { etiqueta: "Excedentes mensuales", uf: d.excedenteUF, clp: d.excedenteCLP };
  if (d.tipo === "adicional") {
    return { etiqueta: "Cotización adicional mensual", uf: d.adicionalUF, clp: d.adicionalCLP };
  }
  return null;
}

export function lineaVariacion(item: ResultadoPlanAlternativa): LineaMonto | null {
  const { variacionVsActualUF: uf, variacionVsActualCLP: clp } = item;
  if (uf === null || clp === null) return null;
  return {
    etiqueta: uf <= 0 ? "Ahorro vs. plan actual" : "Mayor costo vs. plan actual",
    uf: Math.abs(uf),
    clp: Math.abs(clp),
  };
}

/** Componentes del precio final: base × factores, GES, CAEC y seguros. */
export function desglosePlan(item: ResultadoPlanAlternativa, valorUF: number): LineaMonto[] {
  const p = item.resultado.plan;
  return [
    {
      etiqueta: "Precio base × suma de factores",
      detalle: `${formatUF(p.precioBaseUF)} × ${formatFactor(p.sumaFactores)}`,
      uf: p.precioBaseAjustadoUF,
      clp: ufACLP(p.precioBaseAjustadoUF, valorUF),
    },
    ...p.coberturas.map((c) => ({
      etiqueta: c.nombre,
      detalle:
        c.modalidad === "por_beneficiario"
          ? `${formatUF(c.precioUnitarioUF)} × ${c.cantidad} ${c.cantidad === 1 ? "beneficiario" : "beneficiarios"}`
          : "Por contrato",
      uf: c.totalUF,
      clp: ufACLP(c.totalUF, valorUF),
    })),
  ];
}

const monto = (l: Pick<LineaMonto, "uf" | "clp">) => `${formatUF(l.uf)} (${formatCLP(l.clp)})`;

const lineaTexto = (l: LineaMonto) =>
  `${l.etiqueta}${l.detalle ? ` (${l.detalle})` : ""}: ${monto(l)}`;

export function mensajeWhatsApp(p: Propuesta): string {
  const { resultado, valorUF } = p;
  const legal = resultado.cotizacionLegal;
  const bloques: string[][] = [];

  bloques.push([
    p.clienteNombre
      ? `Hola ${p.clienteNombre.trim().split(/\s+/)[0]}, te comparto la comparación de planes de salud.`
      : "Hola, te comparto la comparación de planes de salud.",
  ]);

  bloques.push([
    "*Tu 7% legal*",
    `Renta imponible: ${formatCLP(legal.rentaImponibleCLP)} (${formatUF(legal.rentaImponibleUF)})`,
    ...(legal.aplicaTope ? [`Con tope imponible de ${formatFactor(p.topeImponibleUF)} UF`] : []),
    `7% obligatorio: *${formatUF(legal.cotizacionLegalUF)}* (${formatCLP(legal.cotizacionLegalCLP)})`,
  ]);

  if (resultado.planActual) {
    const isapre = nombreIsapre(p.isapreActual);
    const dif = lineaDiferencia(resultado.planActual.diferencia);
    bloques.push([
      `*Plan actual${isapre ? ` (${isapre})` : ""}*`,
      `Precio: ${monto({ uf: resultado.planActual.precioUF, clp: resultado.planActual.precioCLP })}`,
      ...(dif ? [lineaTexto(dif)] : []),
    ]);
  }

  resultado.planes.forEach((item, i) => {
    const isapre = nombreIsapre(item.plan.isapreId);
    const dif = lineaDiferencia(item.resultado.diferencia);
    const variacion = lineaVariacion(item);
    bloques.push([
      `*Propuesta ${i + 1}: ${item.plan.nombre}${isapre ? ` (${isapre})` : ""}*`,
      ...desglosePlan(item, valorUF.valor).map(lineaTexto),
      `Precio final: *${formatUF(item.resultado.plan.precioFinalUF)}* (${formatCLP(item.resultado.plan.precioFinalCLP)})`,
      ...(dif ? [lineaTexto(dif)] : ["Cubierto exacto por tu 7%"]),
      ...(variacion ? [lineaTexto(variacion)] : []),
    ]);
  });

  bloques.push([`Valores calculados con ${textoValorUF(valorUF)}.`, `_${NOTA_LEGAL}_`]);

  if (p.asesor) {
    const contacto = [p.asesor.telefono && formatearTelefono(p.asesor.telefono), p.asesor.email]
      .filter(Boolean)
      .join(" · ");
    bloques.push([p.asesor.nombre, ...(contacto ? [contacto] : [])]);
  }

  return bloques.map((b) => b.join("\n")).join("\n\n");
}

/** Enlace wa.me; sin teléfono, WhatsApp pide elegir el contacto. */
export function urlWhatsApp(texto: string, telefono?: string | null): string {
  const destino = telefono ? telefono.replace(/\D/g, "") : "";
  return `https://wa.me/${destino}?text=${encodeURIComponent(texto)}`;
}
