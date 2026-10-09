import { fechaHoy, instanteEnChile } from "@/lib/fecha";
import { avanceMes, porcentajeMeta, type EtapaMeta } from "@/lib/metas";

export const MINUTOS_AVISO = 15;
export const DIAS_ESTANCADO = 5;
export const UMBRALES_META = [50, 80, 100] as const;

export type TipoAlerta = "agenda_antes" | "agenda_ahora" | "agenda_dia" | "etapa" | "estancado" | "meta";

export interface AlertaNueva {
  tipo: TipoAlerta;
  dedup: string;
  titulo: string;
  cuerpo: string;
  prospectoId: string | null;
  url: string;
}

export interface ProspectoAlerta {
  id: string;
  nombre: string;
  etapaId: string;
  proximoContacto: string | null;
  /** "HH:MM". Sin hora, el aviso del día es uno solo. */
  horaContacto: string | null;
  actualizadoEn: string;
  cerradoEn: string | null;
  ufCierre: number | null;
}

export interface EntradaAlertas {
  ahora: Date;
  prospectos: ProspectoAlerta[];
  etapas: EtapaMeta[];
  metaUfMes: number | null;
  dedups: ReadonlySet<string>;
}

function enVentana(ahora: Date, inicio: Date): boolean {
  const desde = inicio.getTime();
  return ahora.getTime() >= desde && ahora.getTime() < desde + MINUTOS_AVISO * 60_000;
}

function agregar(lista: AlertaNueva[], dedups: ReadonlySet<string>, alerta: AlertaNueva) {
  if (!dedups.has(alerta.dedup)) lista.push(alerta);
}

/** Alertas de agenda, estancados y meta que corresponden a `ahora`. No incluye el cambio de etapa. */
export function alertasProgramadas(entrada: EntradaAlertas): AlertaNueva[] {
  const { ahora, prospectos, etapas, metaUfMes, dedups } = entrada;
  const hoy = fechaHoy(ahora);
  const mes = hoy.slice(0, 7);
  const abiertas = new Set(etapas.filter((e) => e.tipo === "abierta").map((e) => e.id));
  const lista: AlertaNueva[] = [];

  for (const p of prospectos) {
    if (p.proximoContacto) {
      const url = `/prospectos/${p.id}`;
      if (p.horaContacto) {
        const cita = instanteEnChile(p.proximoContacto, p.horaContacto);
        const antes = new Date(cita.getTime() - MINUTOS_AVISO * 60_000);
        if (enVentana(ahora, antes)) {
          agregar(lista, dedups, {
            tipo: "agenda_antes",
            dedup: `agenda:${p.id}:${p.proximoContacto}:${p.horaContacto}:antes`,
            titulo: "Contacto en 15 minutos",
            cuerpo: `En 15 minutos: contacto con ${p.nombre}.`,
            prospectoId: p.id,
            url,
          });
        }
        if (enVentana(ahora, cita)) {
          agregar(lista, dedups, {
            tipo: "agenda_ahora",
            dedup: `agenda:${p.id}:${p.proximoContacto}:${p.horaContacto}:ahora`,
            titulo: "Hora del contacto",
            cuerpo: `Es la hora del contacto con ${p.nombre}.`,
            prospectoId: p.id,
            url,
          });
        }
      } else if (p.proximoContacto === hoy) {
        agregar(lista, dedups, {
          tipo: "agenda_dia",
          dedup: `agenda:${p.id}:${p.proximoContacto}:dia`,
          titulo: "Contacto de hoy",
          cuerpo: `Hoy tienes un contacto con ${p.nombre}.`,
          prospectoId: p.id,
          url,
        });
      }
    }

    if (abiertas.has(p.etapaId)) {
      const quieto = ahora.getTime() - new Date(p.actualizadoEn).getTime();
      if (quieto >= DIAS_ESTANCADO * 24 * 60 * 60 * 1000) {
        agregar(lista, dedups, {
          tipo: "estancado",
          dedup: `estancado:${p.id}:${p.actualizadoEn}`,
          titulo: "Prospecto sin gestión",
          cuerpo: `${p.nombre} lleva más de ${DIAS_ESTANCADO} días sin gestión.`,
          prospectoId: p.id,
          url: `/prospectos/${p.id}`,
        });
      }
    }
  }

  const uf = avanceMes(prospectos, etapas, mes).uf;
  const porcentaje = porcentajeMeta(uf, metaUfMes);
  if (porcentaje !== null) {
    for (const umbral of UMBRALES_META) {
      if (porcentaje + 1e-9 >= umbral) {
        agregar(lista, dedups, {
          tipo: "meta",
          dedup: `meta:${mes}:${umbral}`,
          titulo: "Meta de UF",
          cuerpo: `Llegaste al ${umbral}% de la meta de UF de este mes.`,
          prospectoId: null,
          url: "/",
        });
      }
    }
  }

  return lista;
}

export function alertaCambioEtapa(prospectoId: string, nombre: string, etapaId: string, etapaNombre: string, instante: number): AlertaNueva {
  return {
    tipo: "etapa",
    dedup: `etapa:${prospectoId}:${etapaId}:${instante}`,
    titulo: "Cambio de etapa",
    cuerpo: `${nombre} pasó a ${etapaNombre}.`,
    prospectoId,
    url: `/prospectos/${prospectoId}`,
  };
}
