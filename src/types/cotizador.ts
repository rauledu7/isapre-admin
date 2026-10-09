import type { IsapreId } from "./isapre";

/** Valores de input tal como los escribe el asesor (texto), antes de validar. */
export interface ClienteForm {
  rentaImponibleCLP: string;
  edadTitular: string;
  isapreActual: IsapreId | null;
  precioPlanActualUF: string;
}

export interface CargaForm {
  id: string;
  edad: string;
}

export interface PlanForm {
  id: string;
  isapreId: IsapreId | null;
  nombre: string;
  precioBaseUF: string;
  /** UF por contrato. En pantalla: productos adicionales. */
  seguroUF: string;
  /** Código elegido en el tarifario de la Isapre. */
  codigoTarifa?: string | null;
  /** Códigos de productos adicionales marcados. */
  productosTarifa?: string[];
  /** Suma la columna CONS UF del plan, una vez por contrato. */
  incluyeConsulta?: boolean;
}
