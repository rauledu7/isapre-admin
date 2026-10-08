import type { Prospecto } from "@/types/isapre";

const sinTildes = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** "12.345.678-5" → "123456785"; la K se compara en minúscula. */
const soloRut = (s: string) => s.replace(/[^0-9kK]/g, "").toLowerCase();

/**
 * Coincide si todas las palabras de la consulta aparecen en el nombre (sin tildes ni mayúsculas),
 * o si la consulta parece un RUT (≥ 3 dígitos) y es parte del RUT sin puntos ni guion.
 */
export function coincideProspecto(prospecto: Pick<Prospecto, "nombre" | "rut">, consulta: string): boolean {
  const q = consulta.trim();
  if (q === "") return true;

  const palabras = sinTildes(q).split(/\s+/);
  const nombre = sinTildes(prospecto.nombre);
  if (palabras.every((p) => nombre.includes(p))) return true;

  const rutConsulta = soloRut(q);
  return /\d{3}/.test(rutConsulta) && soloRut(prospecto.rut).includes(rutConsulta);
}

export function filtrarProspectos<T extends Pick<Prospecto, "nombre" | "rut">>(prospectos: T[], consulta: string): T[] {
  return consulta.trim() === "" ? prospectos : prospectos.filter((p) => coincideProspecto(p, consulta));
}
