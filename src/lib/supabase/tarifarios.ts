import type { Json } from "@/types/database";
import type { IsapreId } from "@/types/isapre";
import type { PlanTarifa, ProductoTarifa, TarifarioLeido, TramoProducto } from "@/lib/tarifario";

import type { Supabase } from "./client";
import { ErrorDatos } from "./prospectos";

export interface TarifarioGuardado extends TarifarioLeido {
  isapreId: IsapreId;
}

function esTramo(valor: unknown): valor is TramoProducto {
  if (!valor || typeof valor !== "object") return false;
  const fila = valor as TramoProducto;
  return [fila.edadDesde, fila.edadHasta, fila.precioUF].every((n) => typeof n === "number");
}

function esPlan(valor: unknown): valor is PlanTarifa {
  if (!valor || typeof valor !== "object") return false;
  const fila = valor as PlanTarifa;
  return typeof fila.codigo === "string" && typeof fila.precioBaseUF === "number";
}

function esProducto(valor: unknown): valor is ProductoTarifa {
  if (!valor || typeof valor !== "object") return false;
  const fila = valor as ProductoTarifa;
  return typeof fila.codigo === "string" && Array.isArray(fila.tramos) && fila.tramos.every(esTramo);
}

export function aTarifario(fila: {
  isapre_id: string;
  titulo: string | null;
  planes: Json;
  productos: Json;
}): TarifarioGuardado | null {
  if (!Array.isArray(fila.planes) || !Array.isArray(fila.productos)) return null;
  if (!fila.planes.every(esPlan) || !fila.productos.every(esProducto)) return null;
  const productos = fila.productos as unknown as ProductoTarifa[];
  return {
    isapreId: fila.isapre_id as IsapreId,
    titulo: fila.titulo,
    planes: fila.planes as unknown as PlanTarifa[],
    productos: productos.map((producto) => ({ ...producto, quintoGratis: Boolean(producto.quintoGratis) })),
  };
}

export async function listarTarifarios(sb: Supabase): Promise<TarifarioGuardado[]> {
  const { data, error } = await sb.from("tarifarios").select("isapre_id, titulo, planes, productos");
  if (error?.code === "42P01" || error?.code === "PGRST205") return [];
  if (error) throw new ErrorDatos(`No se pudieron cargar los tarifarios: ${error.message}`);
  return (data ?? []).flatMap((fila) => {
    const tarifario = aTarifario(fila);
    return tarifario ? [tarifario] : [];
  });
}

export function jsonTarifario(leido: TarifarioLeido): { planes: Json; productos: Json } {
  return { planes: leido.planes as unknown as Json, productos: leido.productos as unknown as Json };
}
