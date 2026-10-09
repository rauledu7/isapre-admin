import { ISAPRES } from "@/config/isapres";
import { EDAD_MAXIMA } from "@/lib/cotizadorForm";
import { parseEntero } from "@/lib/format";
import { normalizarRut } from "@/lib/rut";
import { normalizarTelefono } from "@/lib/telefono";
import type { EtapaEmbudo, IsapreId } from "@/types/isapre";

import type { ProspectoDatos } from "./prospectoForm";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const NOMBRE_MAX = 120;

type Campo = "nombre" | "rut" | "telefono" | "email" | "renta" | "isapre" | "cargas" | "etapa";

const ALIAS: { campo: Campo; alias: string }[] = [
  { campo: "renta", alias: "renta imponible" },
  { campo: "isapre", alias: "isapre actual" },
  { campo: "etapa", alias: "etapa inicial" },
  { campo: "nombre", alias: "nombre" },
  { campo: "rut", alias: "rut" },
  { campo: "telefono", alias: "telefono" },
  { campo: "telefono", alias: "fono" },
  { campo: "telefono", alias: "celular" },
  { campo: "email", alias: "email" },
  { campo: "email", alias: "correo" },
  { campo: "renta", alias: "renta" },
  { campo: "isapre", alias: "isapre" },
  { campo: "cargas", alias: "cargas" },
  { campo: "etapa", alias: "etapa" },
];

export interface FilaLista {
  fila: number;
  datos: ProspectoDatos;
}

export interface FilaOmitida {
  fila: number;
  motivo: string;
}

export type InformeImportacion =
  | { ok: false; error: string }
  | { ok: true; listas: FilaLista[]; omitidas: FilaOmitida[] };

export function textoCelda(valor: unknown): string {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return Number.isInteger(valor) ? String(valor) : String(valor);
  }
  if (typeof valor === "string") return valor.trim();
  return "";
}

function fold(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compacto(valor: string): string {
  return fold(valor).replace(/ /g, "");
}

function mapearColumnas(fila: unknown[]): Map<Campo, number> | null {
  const columnas = new Map<Campo, number>();
  fila.forEach((celda, indice) => {
    const titulo = fold(textoCelda(celda));
    if (!titulo) return;
    const match = ALIAS.find((item) => titulo === item.alias || titulo.startsWith(`${item.alias} `));
    if (match && !columnas.has(match.campo)) columnas.set(match.campo, indice);
  });
  return columnas.has("nombre") && columnas.has("telefono") ? columnas : null;
}

function valor(fila: unknown[], columnas: Map<Campo, number>, campo: Campo): string {
  const indice = columnas.get(campo);
  return indice === undefined ? "" : textoCelda(fila[indice]);
}

function resolverIsapre(texto: string): IsapreId | null | "desconocida" {
  const clave = compacto(texto);
  if (!clave) return null;
  const coinciden = ISAPRES.filter((isapre) => {
    const id = isapre.id.replace(/-/g, "");
    const nombre = compacto(isapre.nombre);
    return clave === id || clave === nombre || (clave.length >= 5 && (nombre.includes(clave) || clave.includes(nombre)));
  });
  const unica = coinciden[0];
  return coinciden.length === 1 && unica ? unica.id : "desconocida";
}

function resolverEtapa(texto: string, etapas: EtapaEmbudo[]): string | "desconocida" | null {
  const clave = fold(texto);
  if (!clave) return null;
  const exactas = etapas.filter((etapa) => fold(etapa.nombre) === clave);
  if (exactas.length === 1 && exactas[0]) return exactas[0].id;
  const parciales = etapas.filter((etapa) => {
    const nombre = fold(etapa.nombre);
    return nombre.startsWith(clave) || clave.startsWith(nombre);
  });
  const unica = parciales[0];
  return parciales.length === 1 && unica ? unica.id : "desconocida";
}

function leerRenta(texto: string): number | null | "invalida" {
  const limpio = texto.trim();
  if (!limpio) return null;
  if (!/^\$?\s*[\d.,\s]+$/.test(limpio)) return "invalida";
  const digitos = limpio.replace(/\D/g, "");
  if (!digitos) return "invalida";
  const renta = Number(digitos);
  return Number.isSafeInteger(renta) ? renta : "invalida";
}

function leerCargas(texto: string): number[] | "invalidas" {
  const limpio = texto.trim();
  if (!limpio) return [];
  const partes = limpio.split(/[,;/|]+|\s+y\s+/i).map((parte) => parte.trim()).filter(Boolean);
  const edades: number[] = [];
  for (const parte of partes) {
    if (!/^\d+$/.test(parte.replace(/\./g, ""))) return "invalidas";
    const edad = parseEntero(parte);
    if (edad === null || edad > EDAD_MAXIMA) return "invalidas";
    edades.push(edad);
  }
  return edades;
}

function filaVacia(fila: unknown[]): boolean {
  return fila.every((celda) => textoCelda(celda) === "");
}

/**
 * Revisa una hoja ya leída (primera fila de títulos). Omite filas sin nombre o teléfono,
 * con RUT inválido o con un dato opcional ilegible. No escribe en la base.
 */
export function revisarImportacion(
  filas: unknown[][],
  etapas: EtapaEmbudo[],
  rutsExistentes: ReadonlySet<string>,
): InformeImportacion {
  const porOrden = [...etapas].sort((a, b) => a.orden - b.orden);
  const porDefecto = porOrden[0];
  if (!porDefecto) return { ok: false, error: "Crea al menos una etapa antes de importar." };

  let encabezado: { indice: number; columnas: Map<Campo, number> } | null = null;
  let sinRut = false;
  const limite = Math.min(filas.length, 15);
  for (let i = 0; i < limite; i++) {
    const fila = filas[i];
    if (!fila) continue;
    const columnas = mapearColumnas(fila);
    if (!columnas) continue;
    if (!columnas.has("rut")) {
      sinRut = true;
      continue;
    }
    encabezado = { indice: i, columnas };
    break;
  }
  if (!encabezado) {
    return {
      ok: false,
      error: sinRut
        ? "Falta la columna RUT. Sin RUT no se puede crear el prospecto."
        : "No encontré las columnas Nombre y Teléfono. Ponlas en la primera fila.",
    };
  }

  const listas: FilaLista[] = [];
  const omitidas: FilaOmitida[] = [];
  const rutsEnArchivo = new Set<string>();

  filas.forEach((fila, indice) => {
    if (indice <= encabezado.indice || filaVacia(fila)) return;
    const numero = indice + 1;
    const nombre = valor(fila, encabezado.columnas, "nombre").trim();
    const telefonoTexto = valor(fila, encabezado.columnas, "telefono");
    const rutTexto = valor(fila, encabezado.columnas, "rut");
    const emailTexto = valor(fila, encabezado.columnas, "email");
    const motivos: string[] = [];

    if (!nombre && !telefonoTexto.trim()) motivos.push("Faltan nombre y teléfono");
    else {
      if (!nombre) motivos.push("Falta el nombre");
      if (!telefonoTexto.trim()) motivos.push("Falta el teléfono");
    }
    if (nombre.length > NOMBRE_MAX) motivos.push("El nombre supera 120 caracteres");

    const telefono = telefonoTexto.trim() ? normalizarTelefono(telefonoTexto) : null;
    if (telefonoTexto.trim() && !telefono) motivos.push("Teléfono inválido");

    const rut = rutTexto ? normalizarRut(rutTexto) : null;
    if (!rutTexto) motivos.push("Falta el RUT");
    else if (!rut) motivos.push("RUT inválido");

    const email = emailTexto || null;
    if (email && !EMAIL_RE.test(email)) motivos.push("Email inválido");

    const renta = leerRenta(valor(fila, encabezado.columnas, "renta"));
    if (renta === "invalida") motivos.push("Renta inválida");

    const isapre = resolverIsapre(valor(fila, encabezado.columnas, "isapre"));
    if (isapre === "desconocida") motivos.push("Isapre desconocida");

    const cargas = leerCargas(valor(fila, encabezado.columnas, "cargas"));
    if (cargas === "invalidas") motivos.push("Cargas inválidas: edades separadas por coma");

    const etapa = resolverEtapa(valor(fila, encabezado.columnas, "etapa"), etapas);
    if (etapa === "desconocida") motivos.push("Etapa desconocida");

    if (rut && rutsExistentes.has(rut)) motivos.push("Ya existe un prospecto con este RUT");
    if (rut && rutsEnArchivo.has(rut)) motivos.push("RUT repetido en el archivo");

    if (motivos.length > 0 || !rut || !telefono || renta === "invalida" || isapre === "desconocida" || cargas === "invalidas") {
      omitidas.push({ fila: numero, motivo: motivos.join(". ") });
      return;
    }

    rutsEnArchivo.add(rut);
    listas.push({
      fila: numero,
      datos: {
        etapaId: etapa ?? porDefecto.id,
        nombre,
        rut,
        telefono,
        email,
        edad: null,
        rentaImponibleCLP: renta,
        isapreActual: isapre,
        cargas,
        proximoContacto: null,
        horaContacto: null,
        cerradoEn: null,
        ufCierre: null,
      },
    });
  });

  return { ok: true, listas, omitidas };
}
