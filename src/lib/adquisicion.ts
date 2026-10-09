import { normalizarRut } from "@/lib/rut";
import { normalizarTelefono } from "@/lib/telefono";
import type { TipoEtapa } from "@/types/isapre";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface Atribucion {
  gclid: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  utmKw: string | null;
}

export interface LeadValido extends Atribucion {
  nombre: string;
  rut: string;
  telefono: string;
  email: string | null;
}

export type LecturaLead = { ok: true; datos: LeadValido } | { ok: false; errores: string[] };

function texto(valor: unknown, max: number): string | null | "largo" {
  if (valor == null) return null;
  const limpio = String(valor).trim();
  if (!limpio) return null;
  if (limpio.length > max) return "largo";
  return limpio;
}

/** Body del webhook de landing o Google Ads. Exige nombre, RUT y teléfono. */
export function leerLead(body: unknown): LecturaLead {
  if (!body || typeof body !== "object") return { ok: false, errores: ["El cuerpo debe ser un objeto JSON"] };
  const fila = body as Record<string, unknown>;
  const errores: string[] = [];

  const nombre = texto(fila.nombre, 120);
  if (!nombre) errores.push("Falta el nombre");
  else if (nombre === "largo") errores.push("El nombre supera 120 caracteres");

  const rut = typeof fila.rut === "string" || typeof fila.rut === "number" ? normalizarRut(String(fila.rut)) : null;
  if (fila.rut == null || String(fila.rut).trim() === "") errores.push("Falta el RUT");
  else if (!rut) errores.push("RUT inválido");

  const telefonoCrudo = fila.telefono == null ? "" : String(fila.telefono);
  const telefono = telefonoCrudo.trim() ? normalizarTelefono(telefonoCrudo) : null;
  if (!telefonoCrudo.trim()) errores.push("Falta el teléfono");
  else if (!telefono) errores.push("Teléfono inválido");

  const email = texto(fila.email, 180);
  if (email === "largo") errores.push("Email demasiado largo");
  else if (email && !EMAIL_RE.test(email)) errores.push("Email inválido");

  const gclid = texto(fila.gclid, 255);
  const utmSource = texto(fila.utm_source, 120);
  const utmCampaign = texto(fila.utm_campaign, 120);
  const utmKw = texto(fila.utm_kw, 120);
  for (const [campo, valor] of [
    ["gclid", gclid],
    ["utm_source", utmSource],
    ["utm_campaign", utmCampaign],
    ["utm_kw", utmKw],
  ] as const) {
    if (valor === "largo") errores.push(`${campo} es demasiado largo`);
  }

  if (errores.length > 0 || !nombre || nombre === "largo" || !rut || !telefono || email === "largo" || gclid === "largo") {
    return { ok: false, errores };
  }

  return {
    ok: true,
    datos: {
      nombre,
      rut,
      telefono,
      email: email ?? null,
      gclid: gclid ?? null,
      utmSource: utmSource && utmSource !== "largo" ? utmSource : null,
      utmCampaign: utmCampaign && utmCampaign !== "largo" ? utmCampaign : null,
      utmKw: utmKw && utmKw !== "largo" ? utmKw : null,
    },
  };
}

export interface ProspectoCampana {
  utmCampaign: string | null;
  etapaId: string;
  ufCierre: number | null;
}

export interface ResumenCampana {
  campana: string;
  leads: number;
  cierres: number;
  ufCerradas: number;
}

export interface MetricaGoogle {
  nombre: string;
  clics: number;
  gasto: number;
}

export interface FilaCampana extends ResumenCampana {
  clics: number | null;
  gasto: number | null;
}

function clave(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** Leads, cierres y UF agrupados por utm_campaign. */
export function resumenCampanas(prospectos: ProspectoCampana[], etapas: { id: string; tipo: TipoEtapa }[]): ResumenCampana[] {
  const ganadas = new Set(etapas.filter((etapa) => etapa.tipo === "ganada").map((etapa) => etapa.id));
  const porCampana = new Map<string, ResumenCampana>();
  for (const prospecto of prospectos) {
    const campana = prospecto.utmCampaign?.trim() || "Sin campaña";
    const fila = porCampana.get(campana) ?? { campana, leads: 0, cierres: 0, ufCerradas: 0 };
    fila.leads += 1;
    if (ganadas.has(prospecto.etapaId)) {
      fila.cierres += 1;
      fila.ufCerradas += prospecto.ufCierre ?? 0;
    }
    porCampana.set(campana, fila);
  }
  return [...porCampana.values()].sort((a, b) => b.leads - a.leads || a.campana.localeCompare(b.campana, "es"));
}

/** Cruza el resumen local con clics y gasto de Google Ads. Sin API, clics y gasto quedan en null. */
export function conMetricas(filas: ResumenCampana[], google: MetricaGoogle[] | null): FilaCampana[] {
  if (!google) return filas.map((fila) => ({ ...fila, clics: null, gasto: null }));
  const usadas = new Set<number>();
  const unidas = filas.map((fila) => {
    const indice = google.findIndex((metrica, i) => !usadas.has(i) && clave(metrica.nombre) === clave(fila.campana));
    if (indice < 0) return { ...fila, clics: null, gasto: null };
    usadas.add(indice);
    const metrica = google[indice];
    return { ...fila, clics: metrica?.clics ?? null, gasto: metrica?.gasto ?? null };
  });
  google.forEach((metrica, indice) => {
    if (usadas.has(indice)) return;
    unidas.push({ campana: metrica.nombre, leads: 0, cierres: 0, ufCerradas: 0, clics: metrica.clics, gasto: metrica.gasto });
  });
  return unidas;
}

export function costoPorLead(gasto: number | null, leads: number): number | null {
  if (gasto === null || leads <= 0) return null;
  return gasto / leads;
}
