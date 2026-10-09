export const BUCKET_DOCUMENTOS = "prospecto-documentos";
export const TAMANO_MAX_BYTES = 10 * 1024 * 1024;

export const TIPOS_DOCUMENTO = [
  { id: "liquidacion", nombre: "Liquidación de sueldo" },
  { id: "cedula", nombre: "Cédula de identidad" },
  { id: "afp", nombre: "Certificado de cotizaciones (AFP)" },
  { id: "fun", nombre: "FUN firmado" },
  { id: "cargas", nombre: "Certificado de cargas / nacimiento" },
  { id: "otros", nombre: "Otros" },
] as const;

export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number]["id"];

const MIME = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export function esTipoDocumento(valor: string): valor is TipoDocumento {
  return TIPOS_DOCUMENTO.some((tipo) => tipo.id === valor);
}

export function nombreTipoDocumento(id: string): string {
  return TIPOS_DOCUMENTO.find((tipo) => tipo.id === id)?.nombre ?? "Otros";
}

export function archivoAceptado(archivo: { type: string; size: number }): string | null {
  if (!MIME.has(archivo.type)) return "Solo PDF, JPG, PNG o WEBP.";
  if (archivo.size <= 0 || archivo.size > TAMANO_MAX_BYTES) return "El archivo debe pesar entre 1 byte y 10 MB.";
  return null;
}

export function nombreSeguro(nombre: string): string {
  const base = nombre
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (base || "archivo").slice(0, 80);
}

export function sePrevisualiza(mime: string): boolean {
  return mime === "application/pdf" || mime.startsWith("image/");
}
