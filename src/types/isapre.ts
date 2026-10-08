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

export type EstadoProspecto =
  | "nuevo_contacto"
  | "evaluando"
  | "cotizacion_enviada"
  | "en_firma_fun"
  | "afiliado";

export interface CanalContacto {
  telefono: string;
  whatsapp?: string;
  email?: string;
}

export interface Prospecto {
  id: string;
  nombre: string;
  rut?: string;
  contacto: CanalContacto;
  edad: number;
  rentaImponibleCLP: number;
  isapreActual: IsapreId | null;
  cargas: Carga[];
  estado: EstadoProspecto;
  notas: string;
  creadoEn: string;
  actualizadoEn: string;
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

export interface Cotizacion {
  id: string;
  prospectoId: string;
  planId: string;
  valorUF: ValorUF;
  resultado: ResultadoCotizacion;
  creadaEn: string;
}
