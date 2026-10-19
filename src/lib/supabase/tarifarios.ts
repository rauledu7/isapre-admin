import type { Json } from "@/types/database";
import type { IsapreId } from "@/types/isapre";
import type { PlanTarifa, ProductoTarifa, TarifarioLeido, TramoProducto } from "@/lib/tarifario";
import { combinarTarifarios } from "@/lib/tarifariosCuenta";

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
    productos: productos.map((producto) => ({
      ...producto,
      quintoGratis: Boolean(producto.quintoGratis),
      fijo: producto.fijo === true,
      modalidad: producto.modalidad === "por_contrato" ? "por_contrato" : "por_beneficiario",
    })),
  };
}

const faltaTabla = (code?: string) => code === "42P01" || code === "PGRST205";

function leerFilas(
  data: { isapre_id: string; titulo: string | null; planes: Json; productos: Json }[] | null,
): TarifarioGuardado[] {
  return (data ?? []).flatMap((fila) => {
    const tarifario = aTarifario(fila);
    return tarifario ? [tarifario] : [];
  });
}

export async function listarTarifarios(sb: Supabase): Promise<TarifarioGuardado[]> {
  const [propios, base, ocultos] = await Promise.all([
    sb.from("tarifarios").select("isapre_id, titulo, planes, productos"),
    sb.from("tarifarios_base").select("isapre_id, titulo, planes, productos"),
    sb.from("tarifarios_ocultos").select("isapre_id"),
  ]);
  if (propios.error && !faltaTabla(propios.error.code)) {
    throw new ErrorDatos(`No se pudieron cargar los tarifarios: ${propios.error.message}`);
  }
  if (base.error && !faltaTabla(base.error.code)) {
    throw new ErrorDatos(`No se pudieron cargar los tarifarios: ${base.error.message}`);
  }
  if (ocultos.error && !faltaTabla(ocultos.error.code)) {
    throw new ErrorDatos(`No se pudieron cargar los tarifarios: ${ocultos.error.message}`);
  }
  return combinarTarifarios(
    leerFilas(propios.data),
    faltaTabla(base.error?.code) ? [] : leerFilas(base.data),
    faltaTabla(ocultos.error?.code) ? [] : (ocultos.data ?? []).map((fila) => fila.isapre_id),
  );
}

/** Hay uno propio o uno común, aunque el asesor lo haya quitado de su cuenta. */
export async function hayTarifarioCompartible(sb: Supabase, isapreId: IsapreId): Promise<boolean> {
  const [propio, base] = await Promise.all([
    sb.from("tarifarios").select("isapre_id").eq("isapre_id", isapreId).maybeSingle(),
    sb.from("tarifarios_base").select("isapre_id").eq("isapre_id", isapreId).maybeSingle(),
  ]);
  if (propio.error && !faltaTabla(propio.error.code)) throw new ErrorDatos(propio.error.message);
  if (base.error && !faltaTabla(base.error.code)) throw new ErrorDatos(base.error.message);
  return Boolean(propio.data || base.data);
}

export function jsonTarifario(leido: TarifarioLeido): { planes: Json; productos: Json } {
  return { planes: leido.planes as unknown as Json, productos: leido.productos as unknown as Json };
}
