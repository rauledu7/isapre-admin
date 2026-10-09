const ZONA = "America/Santiago";

/** Fecha de calendario YYYY-MM-DD en Chile. */
export function fechaISO(instante: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instante);
}

export function fechaHoy(ahora: Date): string {
  return fechaISO(ahora);
}

/** "2026-10-08" → "08-10-2026". No pasa por Date: el día no se corre por la zona horaria. */
export function formatFecha(iso: string): string {
  const [anio, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}-${mes}-${anio}`;
}

/** "HH:MM" en hora de pared de Chile, el día `fecha` (YYYY-MM-DD). */
export function instanteEnChile(fecha: string, hora: string): Date {
  const [anio, mes, dia] = fecha.split("-").map(Number) as [number, number, number];
  const [hh, mm] = hora.slice(0, 5).split(":").map(Number) as [number, number];
  const querer = Date.UTC(anio, mes - 1, dia, hh, mm);
  let t = querer;
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  for (let i = 0; i < 3; i++) {
    const partes = fmt.formatToParts(new Date(t));
    const leer = (tipo: Intl.DateTimeFormatPartTypes) => Number(partes.find((p) => p.type === tipo)?.value);
    const obtenido = Date.UTC(leer("year"), leer("month") - 1, leer("day"), leer("hour"), leer("minute"));
    t += querer - obtenido;
  }
  return new Date(t);
}

export function esHora(valor: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);
}

/** Suma días de calendario a una fecha YYYY-MM-DD, sin interpretarla en hora local. */
export function sumarDias(iso: string, dias: number): string {
  if (!esFechaISO(iso)) return iso;
  const [anio, mes, dia] = iso.split("-").map(Number) as [number, number, number];
  const fecha = new Date(Date.UTC(anio, mes - 1, dia + dias));
  const mesNuevo = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const diaNuevo = String(fecha.getUTCDate()).padStart(2, "0");
  return `${fecha.getUTCFullYear()}-${mesNuevo}-${diaNuevo}`;
}

export function esFechaISO(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [anio, mes, dia] = valor.split("-").map(Number) as [number, number, number];
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}
