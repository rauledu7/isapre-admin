import type { ResultadoEvaluacion } from "@/lib/calculators/cotizador";
import type { DatosCotizacion } from "@/lib/cotizadorForm";

export type IsapreId =
  | "banmedica"
  | "consalud"
  | "colmena"
  | "cruz-blanca"
  | "nueva-masvida"
  | "esencial";

export interface Isapre {
  id: IsapreId;
  nombre: string;
}

export type RolBeneficiario = "titular" | "carga";

export interface Carga {
  id: string;
  edad: number;
  /** Reemplaza el factor de la tabla cuando el asesor lo ingresa a mano. */
  factorManual?: number;
}

export interface Beneficiario {
  rol: RolBeneficiario;
  edad: number;
  factor: number;
}

export interface TramoFactor {
  /** Inclusivo. */
  edadDesde: number;
  /** Exclusivo. `null` para el último tramo abierto. */
  edadHasta: number | null;
  factores: Record<RolBeneficiario, number>;
}

export interface TablaFactores {
  id: string;
  nombre: string;
  tramos: TramoFactor[];
}

export type TipoCobertura = "GES" | "CAEC" | "SEGURO";

export type ModalidadCobro = "por_beneficiario" | "por_contrato";

export interface CoberturaAdicional {
  id: string;
  tipo: TipoCobertura;
  nombre: string;
  precioUF: number;
  modalidad: ModalidadCobro;
}

export interface Plan {
  id: string;
  isapreId: IsapreId;
  nombre: string;
  codigo?: string;
  precioBaseUF: number;
  coberturas: CoberturaAdicional[];
}

export type TipoEtapa = "abierta" | "ganada" | "perdida";

/** Etapa del embudo; editable por cada asesor. */
export interface EtapaEmbudo {
  id: string;
  nombre: string;
  orden: number;
  tipo: TipoEtapa;
}

export interface Prospecto {
  id: string;
  etapaId: string;
  nombre: string;
  /** Normalizado "12345678-5". */
  rut: string;
  /** Normalizado "+56XXXXXXXXX". Obligatorio: sin canal de contacto no se guarda. */
  telefono: string;
  email: string | null;
  edad: number | null;
  rentaImponibleCLP: number | null;
  isapreActual: IsapreId | null;
  /** Edades de las cargas. */
  cargas: number[];
  /** Próximo contacto, YYYY-MM-DD. El calendario lee esta fecha. */
  proximoContacto: string | null;
  /** Hora del contacto en Chile, "HH:MM". Sin hora, el aviso es del día. */
  horaContacto: string | null;
  /** Día en que pasó a una etapa ganada. */
  cerradoEn: string | null;
  /** UF del plan afiliado. Cuenta para la meta del mes de `cerradoEn`. */
  ufCierre: number | null;
  /** Google Click ID, si el lead llegó de un anuncio. */
  gclid: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  utmKw: string | null;
  /** Momento en que se informó la conversión offline a Google Ads. */
  adsConversionEn: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface NotaProspecto {
  id: string;
  prospectoId: string;
  contenido: string;
  creadaEn: string;
}

export interface ValorUF {
  valor: number;
  /** Fecha del valor en formato YYYY-MM-DD (hora de Chile). */
  fecha: string;
  fuente: "mindicador" | "manual";
}

export interface ResultadoCotizacionLegal {
  rentaImponibleCLP: number;
  rentaImponibleUF: number;
  rentaTopadaUF: number;
  rentaTopadaCLP: number;
  aplicaTope: boolean;
  cotizacionLegalUF: number;
  cotizacionLegalCLP: number;
}

export interface DetalleCobertura {
  coberturaId: string;
  tipo: TipoCobertura;
  nombre: string;
  modalidad: ModalidadCobro;
  precioUnitarioUF: number;
  cantidad: number;
  totalUF: number;
}

export interface ResultadoPrecioPlan {
  precioBaseUF: number;
  sumaFactores: number;
  precioBaseAjustadoUF: number;
  coberturas: DetalleCobertura[];
  totalCoberturasUF: number;
  precioFinalUF: number;
  precioFinalCLP: number;
}

export type TipoDiferencia = "excedente" | "adicional" | "sin_diferencia";

export interface ResultadoDiferencia {
  tipo: TipoDiferencia;
  diferenciaUF: number;
  diferenciaCLP: number;
  excedenteUF: number;
  excedenteCLP: number;
  adicionalUF: number;
  adicionalCLP: number;
}

export interface ResultadoCotizacion {
  valorUF: number;
  topeImponibleUF: number;
  cotizacionLegal: ResultadoCotizacionLegal;
  plan: ResultadoPrecioPlan;
  diferencia: ResultadoDiferencia;
}

/** Snapshot inmutable de una cotización asociada a un prospecto. */
export interface Cotizacion {
  id: string;
  prospectoId: string;
  valorUF: ValorUF;
  topeImponibleUF: number;
  entrada: DatosCotizacion;
  resultado: ResultadoEvaluacion;
  creadaEn: string;
}

/** Datos de contacto del asesor que firman las propuestas al cliente. */
export interface PerfilAsesor {
  nombre: string;
  /** Normalizado "+56XXXXXXXXX". */
  telefono: string | null;
  email: string | null;
  /** Meta de UF cerradas en el mes. `null` si no definió meta. */
  metaUfMes: number | null;
  /** Meta de contratos o afiliados en el mes. */
  metaContratosMes: number | null;
}
