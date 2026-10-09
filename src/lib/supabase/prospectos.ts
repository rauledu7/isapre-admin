import type { ResultadoEvaluacion } from "@/lib/calculators/cotizador";
import type { DatosCotizacion } from "@/lib/cotizadorForm";
import type { ProspectoDatos } from "@/lib/prospectoForm";
import type { Database, Json } from "@/types/database";
import type {
  Cotizacion,
  EtapaEmbudo,
  IsapreId,
  NotaProspecto,
  Prospecto,
  TipoEtapa,
  ValorUF,
} from "@/types/isapre";

import type { Supabase } from "./client";

type Tablas = Database["public"]["Tables"];
type EtapaRow = Tablas["etapas_embudo"]["Row"];
type ProspectoRow = Tablas["prospectos"]["Row"];
type NotaRow = Tablas["notas_prospecto"]["Row"];
type CotizacionRow = Tablas["cotizaciones"]["Row"];

const UNIQUE_VIOLATION = "23505";
const FK_VIOLATION = "23503";

export class ErrorDatos extends Error {}

function fallar(error: { code?: string; message: string }, contexto: string): never {
  if (error.code === UNIQUE_VIOLATION) {
    throw new ErrorDatos(`${contexto}: ya existe un registro con ese valor (RUT o nombre repetido)`);
  }
  if (error.code === FK_VIOLATION) {
    throw new ErrorDatos(`${contexto}: hay registros asociados que lo impiden`);
  }
  throw new ErrorDatos(`${contexto}: ${error.message}`);
}

const aEtapa = (r: EtapaRow): EtapaEmbudo => ({
  id: r.id,
  nombre: r.nombre,
  orden: r.orden,
  tipo: r.tipo,
});

const aProspecto = (r: ProspectoRow): Prospecto => ({
  id: r.id,
  etapaId: r.etapa_id,
  nombre: r.nombre,
  rut: r.rut,
  telefono: r.telefono,
  email: r.email,
  edad: r.edad,
  rentaImponibleCLP: r.renta_imponible_clp,
  isapreActual: r.isapre_actual as IsapreId | null,
  cargas: Array.isArray(r.cargas) ? (r.cargas as number[]) : [],
  proximoContacto: r.proximo_contacto ?? null,
  horaContacto: r.hora_contacto ? r.hora_contacto.slice(0, 5) : null,
  cerradoEn: r.cerrado_en ?? null,
  ufCierre: r.uf_cierre == null ? null : Number(r.uf_cierre),
  creadoEn: r.created_at,
  actualizadoEn: r.updated_at,
});

const aFila = (d: Partial<ProspectoDatos>) => ({
  ...(d.etapaId !== undefined && { etapa_id: d.etapaId }),
  ...(d.nombre !== undefined && { nombre: d.nombre }),
  ...(d.rut !== undefined && { rut: d.rut }),
  ...(d.telefono !== undefined && { telefono: d.telefono }),
  ...(d.email !== undefined && { email: d.email }),
  ...(d.edad !== undefined && { edad: d.edad }),
  ...(d.rentaImponibleCLP !== undefined && { renta_imponible_clp: d.rentaImponibleCLP }),
  ...(d.isapreActual !== undefined && { isapre_actual: d.isapreActual }),
  ...(d.cargas !== undefined && { cargas: d.cargas }),
  ...(d.proximoContacto !== undefined && { proximo_contacto: d.proximoContacto }),
  ...(d.horaContacto !== undefined && { hora_contacto: d.horaContacto }),
  ...(d.cerradoEn !== undefined && { cerrado_en: d.cerradoEn }),
  ...(d.ufCierre !== undefined && { uf_cierre: d.ufCierre }),
});

const aNota = (r: NotaRow): NotaProspecto => ({
  id: r.id,
  prospectoId: r.prospecto_id,
  contenido: r.contenido,
  creadaEn: r.created_at,
});

const aCotizacion = (r: CotizacionRow): Cotizacion => ({
  id: r.id,
  prospectoId: r.prospecto_id,
  valorUF: { valor: Number(r.valor_uf), fecha: r.fecha_uf, fuente: r.fuente_uf },
  topeImponibleUF: Number(r.tope_imponible_uf),
  entrada: r.entrada as unknown as DatosCotizacion,
  resultado: r.resultado as unknown as ResultadoEvaluacion,
  creadaEn: r.created_at,
});

// --- Etapas -----------------------------------------------------------------

export async function listarEtapas(sb: Supabase): Promise<EtapaEmbudo[]> {
  const { data, error } = await sb.from("etapas_embudo").select("*").order("orden");
  if (error) fallar(error, "No se pudieron cargar las etapas");
  return data.map(aEtapa);
}

export async function crearEtapa(
  sb: Supabase,
  etapa: { nombre: string; orden: number; tipo: TipoEtapa },
): Promise<EtapaEmbudo> {
  const { data, error } = await sb.from("etapas_embudo").insert(etapa).select().single();
  if (error) fallar(error, "No se pudo crear la etapa");
  return aEtapa(data);
}

export async function actualizarEtapa(
  sb: Supabase,
  id: string,
  cambios: Partial<Pick<EtapaEmbudo, "nombre" | "orden" | "tipo">>,
): Promise<void> {
  const { error } = await sb.from("etapas_embudo").update(cambios).eq("id", id);
  if (error) fallar(error, "No se pudo actualizar la etapa");
}

export async function eliminarEtapa(sb: Supabase, id: string): Promise<void> {
  const { error } = await sb.from("etapas_embudo").delete().eq("id", id);
  if (error) fallar(error, "No se pudo eliminar la etapa");
}

// --- Prospectos ---------------------------------------------------------------

export async function listarProspectos(sb: Supabase): Promise<Prospecto[]> {
  const { data, error } = await sb
    .from("prospectos")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) fallar(error, "No se pudieron cargar los prospectos");
  return data.map(aProspecto);
}

export async function obtenerProspecto(sb: Supabase, id: string): Promise<Prospecto | null> {
  const { data, error } = await sb.from("prospectos").select("*").eq("id", id).maybeSingle();
  if (error) fallar(error, "No se pudo cargar el prospecto");
  return data ? aProspecto(data) : null;
}

export async function crearProspecto(sb: Supabase, datos: ProspectoDatos): Promise<Prospecto> {
  const fila = aFila(datos) as Tablas["prospectos"]["Insert"];
  const { data, error } = await sb.from("prospectos").insert(fila).select().single();
  if (error) fallar(error, "No se pudo crear el prospecto");
  return aProspecto(data);
}

export async function crearProspectos(sb: Supabase, lista: ProspectoDatos[]): Promise<Prospecto[]> {
  if (lista.length === 0) return [];
  const filas = lista.map((datos) => aFila(datos) as Tablas["prospectos"]["Insert"]);
  const { data, error } = await sb.from("prospectos").insert(filas).select();
  if (error) fallar(error, "No se pudieron importar los prospectos");
  return data.map(aProspecto);
}

export async function actualizarProspecto(
  sb: Supabase,
  id: string,
  cambios: Partial<ProspectoDatos>,
): Promise<Prospecto> {
  const { data, error } = await sb
    .from("prospectos")
    .update(aFila(cambios))
    .eq("id", id)
    .select()
    .single();
  if (error) fallar(error, "No se pudo actualizar el prospecto");
  return aProspecto(data);
}

export async function eliminarProspecto(sb: Supabase, id: string): Promise<void> {
  const { error } = await sb.from("prospectos").delete().eq("id", id);
  if (error) fallar(error, "No se pudo eliminar el prospecto");
}

// --- Notas --------------------------------------------------------------------

export async function listarNotas(sb: Supabase, prospectoId: string): Promise<NotaProspecto[]> {
  const { data, error } = await sb
    .from("notas_prospecto")
    .select("*")
    .eq("prospecto_id", prospectoId)
    .order("created_at", { ascending: false });
  if (error) fallar(error, "No se pudieron cargar las notas");
  return data.map(aNota);
}

export async function crearNota(
  sb: Supabase,
  prospectoId: string,
  contenido: string,
): Promise<NotaProspecto> {
  const { data, error } = await sb
    .from("notas_prospecto")
    .insert({ prospecto_id: prospectoId, contenido })
    .select()
    .single();
  if (error) fallar(error, "No se pudo guardar la nota");
  return aNota(data);
}

export async function eliminarNota(sb: Supabase, id: string): Promise<void> {
  const { error } = await sb.from("notas_prospecto").delete().eq("id", id);
  if (error) fallar(error, "No se pudo eliminar la nota");
}

// --- Cotizaciones -------------------------------------------------------------

export async function listarCotizaciones(sb: Supabase, prospectoId: string): Promise<Cotizacion[]> {
  const { data, error } = await sb
    .from("cotizaciones")
    .select("*")
    .eq("prospecto_id", prospectoId)
    .order("created_at", { ascending: false });
  if (error) fallar(error, "No se pudieron cargar las cotizaciones");
  return data.map(aCotizacion);
}

export async function obtenerCotizacion(sb: Supabase, id: string): Promise<Cotizacion | null> {
  const { data, error } = await sb.from("cotizaciones").select("*").eq("id", id).maybeSingle();
  if (error) fallar(error, "No se pudo cargar la cotización");
  return data ? aCotizacion(data) : null;
}

export async function guardarCotizacion(
  sb: Supabase,
  c: {
    prospectoId: string;
    valorUF: ValorUF;
    topeImponibleUF: number;
    entrada: DatosCotizacion;
    resultado: ResultadoEvaluacion;
  },
): Promise<Cotizacion> {
  const { data, error } = await sb
    .from("cotizaciones")
    .insert({
      prospecto_id: c.prospectoId,
      valor_uf: c.valorUF.valor,
      fecha_uf: c.valorUF.fecha,
      fuente_uf: c.valorUF.fuente,
      tope_imponible_uf: c.topeImponibleUF,
      entrada: c.entrada as unknown as Json,
      resultado: c.resultado as unknown as Json,
    })
    .select()
    .single();
  if (error) fallar(error, "No se pudo guardar la cotización");
  return aCotizacion(data);
}
