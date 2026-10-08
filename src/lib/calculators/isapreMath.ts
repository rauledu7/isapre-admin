import { DECIMALES_UF, TASA_COTIZACION_LEGAL } from "@/config/isapres";
import type {
  CoberturaAdicional,
  DetalleCobertura,
  ResultadoCotizacion,
  ResultadoCotizacionLegal,
  ResultadoDiferencia,
  ResultadoPrecioPlan,
} from "@/types/isapre";

function assertFinito(valor: number, nombre: string): void {
  if (!Number.isFinite(valor)) {
    throw new RangeError(`${nombre} debe ser un número finito`);
  }
}

function assertPositivo(valor: number, nombre: string): void {
  assertFinito(valor, nombre);
  if (valor <= 0) throw new RangeError(`${nombre} debe ser mayor que 0`);
}

function assertNoNegativo(valor: number, nombre: string): void {
  assertFinito(valor, nombre);
  if (valor < 0) throw new RangeError(`${nombre} no puede ser negativo`);
}

export function redondearUF(valor: number): number {
  const factor = 10 ** DECIMALES_UF;
  return Math.round((valor + Number.EPSILON) * factor) / factor;
}

export function redondearCLP(valor: number): number {
  return Math.round(valor);
}

export function clpAUF(montoCLP: number, valorUF: number): number {
  assertFinito(montoCLP, "montoCLP");
  assertPositivo(valorUF, "valorUF");
  return montoCLP / valorUF;
}

export function ufACLP(montoUF: number, valorUF: number): number {
  assertFinito(montoUF, "montoUF");
  assertPositivo(valorUF, "valorUF");
  return montoUF * valorUF;
}

export interface EntradaCotizacionLegal {
  rentaImponibleCLP: number;
  valorUF: number;
  topeImponibleUF: number;
}

export function calcularCotizacionLegal({
  rentaImponibleCLP,
  valorUF,
  topeImponibleUF,
}: EntradaCotizacionLegal): ResultadoCotizacionLegal {
  assertNoNegativo(rentaImponibleCLP, "rentaImponibleCLP");
  assertPositivo(topeImponibleUF, "topeImponibleUF");

  const rentaImponibleUF = clpAUF(rentaImponibleCLP, valorUF);
  const aplicaTope = rentaImponibleUF > topeImponibleUF;
  const rentaTopadaUF = aplicaTope ? topeImponibleUF : rentaImponibleUF;
  const cotizacionLegalUF = rentaTopadaUF * TASA_COTIZACION_LEGAL;

  return {
    rentaImponibleCLP,
    rentaImponibleUF,
    rentaTopadaUF,
    rentaTopadaCLP: ufACLP(rentaTopadaUF, valorUF),
    aplicaTope,
    cotizacionLegalUF,
    cotizacionLegalCLP: ufACLP(cotizacionLegalUF, valorUF),
  };
}

export interface EntradaPrecioPlan {
  precioBaseUF: number;
  /** Un factor por beneficiario (titular + cargas). */
  factores: number[];
  coberturas: CoberturaAdicional[];
  valorUF: number;
}

export function calcularPrecioPlan({
  precioBaseUF,
  factores,
  coberturas,
  valorUF,
}: EntradaPrecioPlan): ResultadoPrecioPlan {
  assertNoNegativo(precioBaseUF, "precioBaseUF");
  if (factores.length === 0) {
    throw new RangeError("Debe existir al menos un beneficiario (titular)");
  }
  factores.forEach((f, i) => assertNoNegativo(f, `factores[${i}]`));

  const sumaFactores = factores.reduce((acc, f) => acc + f, 0);
  const precioBaseAjustadoUF = precioBaseUF * sumaFactores;

  const detalle: DetalleCobertura[] = coberturas.map((c) => {
    assertNoNegativo(c.precioUF, `cobertura ${c.id}.precioUF`);
    const cantidad = c.modalidad === "por_beneficiario" ? factores.length : 1;
    return {
      coberturaId: c.id,
      tipo: c.tipo,
      nombre: c.nombre,
      modalidad: c.modalidad,
      precioUnitarioUF: c.precioUF,
      cantidad,
      totalUF: c.precioUF * cantidad,
    };
  });

  const totalCoberturasUF = detalle.reduce((acc, d) => acc + d.totalUF, 0);
  const precioFinalUF = precioBaseAjustadoUF + totalCoberturasUF;

  return {
    precioBaseUF,
    sumaFactores,
    precioBaseAjustadoUF,
    coberturas: detalle,
    totalCoberturasUF,
    precioFinalUF,
    precioFinalCLP: ufACLP(precioFinalUF, valorUF),
  };
}

export function calcularDiferencia(
  cotizacionLegalUF: number,
  precioPlanUF: number,
  valorUF: number,
): ResultadoDiferencia {
  assertNoNegativo(cotizacionLegalUF, "cotizacionLegalUF");
  assertNoNegativo(precioPlanUF, "precioPlanUF");

  const diferenciaUF = cotizacionLegalUF - precioPlanUF;
  const tipo =
    redondearUF(diferenciaUF) === 0
      ? "sin_diferencia"
      : diferenciaUF > 0
        ? "excedente"
        : "adicional";

  const excedenteUF = tipo === "excedente" ? diferenciaUF : 0;
  const adicionalUF = tipo === "adicional" ? -diferenciaUF : 0;

  return {
    tipo,
    diferenciaUF,
    diferenciaCLP: ufACLP(diferenciaUF, valorUF),
    excedenteUF,
    excedenteCLP: ufACLP(excedenteUF, valorUF),
    adicionalUF,
    adicionalCLP: ufACLP(adicionalUF, valorUF),
  };
}

export interface EntradaCotizacion {
  rentaImponibleCLP: number;
  valorUF: number;
  topeImponibleUF: number;
  precioBaseUF: number;
  factores: number[];
  coberturas: CoberturaAdicional[];
}

export function cotizar(entrada: EntradaCotizacion): ResultadoCotizacion {
  const { valorUF, topeImponibleUF } = entrada;
  const cotizacionLegal = calcularCotizacionLegal(entrada);
  const plan = calcularPrecioPlan(entrada);
  const diferencia = calcularDiferencia(
    cotizacionLegal.cotizacionLegalUF,
    plan.precioFinalUF,
    valorUF,
  );

  return { valorUF, topeImponibleUF, cotizacionLegal, plan, diferencia };
}
