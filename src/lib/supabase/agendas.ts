import type { Supabase } from "./client";

export interface Agenda {
  id: string;
  fecha: string;
  hora: string;
  nombre: string;
  nota: string | null;
}

function horaCorta(hora: string): string {
  return hora.slice(0, 5);
}

export async function listarAgendas(sb: Supabase, desde: string, hasta: string): Promise<Agenda[]> {
  const { data, error } = await sb
    .from("agendas")
    .select("id, fecha, hora, nombre, nota")
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("hora");
  if (error?.code === "42P01" || error?.code === "PGRST205") {
    throw new Error("Falta aplicar la migración de la agenda.");
  }
  if (error) throw new Error("No se pudo cargar la agenda.");
  return (data ?? []).map((fila) => ({
    id: fila.id,
    fecha: fila.fecha,
    hora: horaCorta(fila.hora),
    nombre: fila.nombre,
    nota: fila.nota,
  }));
}

export async function crearAgenda(
  sb: Supabase,
  agenda: { fecha: string; hora: string; nombre: string; nota: string },
): Promise<void> {
  const nota = agenda.nota.trim();
  const { error } = await sb.from("agendas").insert({
    fecha: agenda.fecha,
    hora: agenda.hora,
    nombre: agenda.nombre.trim(),
    nota: nota || null,
  });
  if (error?.code === "42P01" || error?.code === "PGRST205") {
    throw new Error("Falta aplicar la migración de la agenda.");
  }
  if (error) throw new Error("No se pudo guardar la cita.");
}

export async function eliminarAgenda(sb: Supabase, id: string): Promise<void> {
  const { error } = await sb.from("agendas").delete().eq("id", id);
  if (error) throw new Error("No se pudo borrar la cita.");
}
