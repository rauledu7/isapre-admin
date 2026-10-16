import {
  aNivel,
  aSuscripcion,
  nivelEfectivo,
  permite,
  suscripcionVigente,
  type Funcion,
  type NivelPlan,
  type PlanPago,
  type Suscripcion,
} from "@/lib/suscripcion";

import type { Supabase } from "./client";
import { ErrorDatos } from "./prospectos";

export type LecturaSuscripcion = { tablaFalta: true } | { tablaFalta: false; suscripcion: Suscripcion | null };

const faltaTabla = (code?: string) => code === "42P01" || code === "PGRST205";

/** Suscripción del asesor con sesión; RLS deja ver solo la suya. Con el cliente admin, pasar `perfilId`. */
export async function obtenerSuscripcion(sb: Supabase, perfilId?: string): Promise<LecturaSuscripcion> {
  let consulta = sb.from("suscripciones").select("estado, plan_id, periodo, fecha_fin_trial, fecha_proximo_pago");
  if (perfilId) consulta = consulta.eq("perfil_id", perfilId);
  const { data, error } = await consulta.maybeSingle();
  if (faltaTabla(error?.code)) return { tablaFalta: true };
  if (error) throw new ErrorDatos(`No se pudo cargar la suscripción: ${error.message}`);
  return { tablaFalta: false, suscripcion: data ? aSuscripcion(data) : null };
}

/** Nivel con el que se habilitan las funciones del asesor. */
export async function nivelDeSuscripcion(sb: Supabase, lectura: LecturaSuscripcion): Promise<NivelPlan> {
  if (lectura.tablaFalta || !lectura.suscripcion?.planId) return "full";
  const { data, error } = await sb.from("planes").select("nivel").eq("id", lectura.suscripcion.planId).maybeSingle();
  if (error) throw new ErrorDatos(`No se pudo cargar el plan: ${error.message}`);
  return nivelEfectivo(lectura.suscripcion, aNivel(data?.nivel ?? null), new Date());
}

/** Para rutas con el cliente admin: suscripción vigente y plan que incluye la función. */
export async function asesorPuedeUsar(admin: Supabase, perfilId: string, funcion: Funcion): Promise<boolean> {
  const lectura = await obtenerSuscripcion(admin, perfilId);
  if (lectura.tablaFalta) return true;
  if (!suscripcionVigente(lectura.suscripcion, new Date())) return false;
  return permite(await nivelDeSuscripcion(admin, lectura), funcion);
}

export interface PagoRegistrado {
  id: string;
  fecha: string;
  detalle: string | null;
  montoCLP: number | null;
  estado: string;
}

export async function listarPagos(sb: Supabase): Promise<PagoRegistrado[]> {
  const { data, error } = await sb
    .from("pagos")
    .select("id, fecha, detalle, monto_clp, estado")
    .order("fecha", { ascending: false })
    .limit(100);
  if (faltaTabla(error?.code)) return [];
  if (error) throw new ErrorDatos(`No se pudo cargar el historial de pagos: ${error.message}`);
  return (data ?? []).map((p) => ({ id: p.id, fecha: p.fecha, detalle: p.detalle, montoCLP: p.monto_clp, estado: p.estado }));
}

export async function listarPlanes(sb: Supabase): Promise<PlanPago[]> {
  const { data, error } = await sb
    .from("planes")
    .select("id, nombre, nivel, precio_mensual_clp, precio_trimestral_clp, precio_anual_clp")
    .order("precio_mensual_clp", { nullsFirst: false });
  if (faltaTabla(error?.code)) return [];
  if (error) throw new ErrorDatos(`No se pudieron cargar los planes: ${error.message}`);
  return (data ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    nivel: aNivel(p.nivel),
    precios: { mensual: p.precio_mensual_clp, trimestral: p.precio_trimestral_clp, anual: p.precio_anual_clp },
  }));
}
