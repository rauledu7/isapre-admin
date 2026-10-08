export interface DiaCalendario {
  fecha: string;
  enMes: boolean;
}

/** Semanas de lunes a domingo. `mes` es 1–12. */
export function grillaMes(anio: number, mes: number): DiaCalendario[][] {
  const primero = new Date(Date.UTC(anio, mes - 1, 1));
  const diasAntes = (primero.getUTCDay() + 6) % 7;
  const cursor = new Date(primero);
  cursor.setUTCDate(1 - diasAntes);

  const semanas: DiaCalendario[][] = [];
  for (let semana = 0; semana < 6; semana++) {
    const dias: DiaCalendario[] = [];
    for (let dia = 0; dia < 7; dia++) {
      const fecha = cursor.toISOString().slice(0, 10);
      dias.push({ fecha, enMes: cursor.getUTCMonth() === mes - 1 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    if (dias.some((d) => d.enMes)) semanas.push(dias);
  }
  return semanas;
}

export interface Seguimiento {
  id: string;
  nombre: string;
  proximoContacto: string | null;
}

export function seguimientosDelDia<T extends Seguimiento>(prospectos: T[], fecha: string): T[] {
  return prospectos
    .filter((p) => p.proximoContacto === fecha)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/** Vencidos primero, luego hoy y los próximos. */
export function seguimientosOrdenados<T extends Seguimiento>(prospectos: T[]): T[] {
  return prospectos
    .filter((p): p is T & { proximoContacto: string } => Boolean(p.proximoContacto))
    .sort(
      (a, b) =>
        a.proximoContacto.localeCompare(b.proximoContacto) || a.nombre.localeCompare(b.nombre, "es"),
    );
}

export function estaVencido(fecha: string, hoy: string): boolean {
  return fecha < hoy;
}
