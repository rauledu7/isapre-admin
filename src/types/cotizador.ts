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
  gesUF: string;
  caecUF: string;
  seguroUF: string;
}
