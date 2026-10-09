import { EDAD_MAXIMA } from "@/lib/cotizadorForm";
import { esFechaISO, esHora } from "@/lib/fecha";
import { parseDecimal, parseEntero } from "@/lib/format";
import { normalizarRut } from "@/lib/rut";
import { normalizarTelefono } from "@/lib/telefono";
import type { IsapreId, Prospecto } from "@/types/isapre";

export interface ProspectoForm {
  nombre: string;
  rut: string;
  telefono: string;
  email: string;
  edad: string;
  rentaImponibleCLP: string;
  isapreActual: IsapreId | null;
  cargas: string[];
  etapaId: string;
  proximoContacto: string;
  horaContacto: string;
  ufCierre: string;
  cerradoEn: string;
  gclid: string;
  utmSource: string;
  utmCampaign: string;
  utmKw: string;
}

export type ProspectoDatos = Omit<Prospecto, "id" | "creadoEn" | "actualizadoEn" | "adsConversionEn" | "origen">;

export type ErroresProspecto = Partial<Record<keyof ProspectoForm, string>>;

export type LecturaProspecto =
  | { ok: true; datos: ProspectoDatos }
  | { ok: false; errores: ErroresProspecto };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function edadOpcional(valor: string): number | null | "invalida" {
  if (valor.trim() === "") return null;
  const edad = parseEntero(valor);
  return edad !== null && edad <= EDAD_MAXIMA ? edad : "invalida";
}

export function leerProspecto(form: ProspectoForm): LecturaProspecto {
  const errores: ErroresProspecto = {};

  const nombre = form.nombre.trim();
  if (!nombre) errores.nombre = "Ingresa el nombre";

  const rut = normalizarRut(form.rut);
  if (!rut) errores.rut = "RUT inválido (revisa el dígito verificador)";

  const telefono = normalizarTelefono(form.telefono);
  if (!telefono) errores.telefono = "Teléfono obligatorio: 9 dígitos, ej. 9 1234 5678";

  const email = form.email.trim() || null;
  if (email && !EMAIL_RE.test(email)) errores.email = "Email inválido";

  const edad = edadOpcional(form.edad);
  if (edad === "invalida") errores.edad = `Edad entre 0 y ${EDAD_MAXIMA}`;

  const renta = form.rentaImponibleCLP.trim() === "" ? null : parseEntero(form.rentaImponibleCLP);
  if (form.rentaImponibleCLP.trim() !== "" && renta === null) {
    errores.rentaImponibleCLP = "Renta inválida";
  }

  const cargas = form.cargas.map(edadOpcional);
  if (cargas.some((c) => c === null || c === "invalida")) {
    errores.cargas = `Cada carga necesita una edad entre 0 y ${EDAD_MAXIMA}`;
  }

  if (!form.etapaId) errores.etapaId = "Selecciona una etapa";

  const contacto = form.proximoContacto.trim();
  if (contacto && !esFechaISO(contacto)) errores.proximoContacto = "Fecha inválida";

  const hora = form.horaContacto.trim();
  if (hora && !esHora(hora)) errores.horaContacto = "Hora inválida";
  if (hora && !contacto) errores.horaContacto = "Indica también la fecha del contacto";

  const uf = form.ufCierre.trim() === "" ? null : parseDecimal(form.ufCierre);
  if (form.ufCierre.trim() !== "" && (uf === null || uf < 0)) errores.ufCierre = "UF inválida";

  if (Object.keys(errores).length > 0) return { ok: false, errores };

  return {
    ok: true,
    datos: {
      etapaId: form.etapaId,
      nombre,
      rut: rut as string,
      telefono: telefono as string,
      email,
      edad: edad as number | null,
      rentaImponibleCLP: renta,
      isapreActual: form.isapreActual,
      cargas: cargas as number[],
      proximoContacto: contacto || null,
      horaContacto: hora && esHora(hora) ? hora : null,
      ufCierre: uf,
      cerradoEn: esFechaISO(form.cerradoEn) ? form.cerradoEn : null,
      gclid: form.gclid.trim() || null,
      utmSource: form.utmSource.trim() || null,
      utmCampaign: form.utmCampaign.trim() || null,
      utmKw: form.utmKw.trim() || null,
    },
  };
}
