import { BUCKET_DOCUMENTOS, archivoAceptado, esTipoDocumento, nombreSeguro, type TipoDocumento } from "@/config/documentos";
import { getSupabase } from "@/lib/supabase/client";

import { ErrorDatos } from "./prospectos";

export interface Documento {
  id: string;
  prospectoId: string;
  nombre: string;
  tipo: TipoDocumento;
  filePath: string;
  mime: string;
  tamanoBytes: number;
  creadoEn: string;
}

function aDocumento(fila: {
  id: string;
  prospecto_id: string;
  nombre: string;
  tipo_doc: string;
  file_path: string;
  mime: string;
  tamano_bytes: number;
  created_at: string;
}): Documento {
  return {
    id: fila.id,
    prospectoId: fila.prospecto_id,
    nombre: fila.nombre,
    tipo: esTipoDocumento(fila.tipo_doc) ? fila.tipo_doc : "otros",
    filePath: fila.file_path,
    mime: fila.mime,
    tamanoBytes: Number(fila.tamano_bytes),
    creadoEn: fila.created_at,
  };
}

export async function listarDocumentos(prospectoId?: string): Promise<Documento[]> {
  let consulta = getSupabase().from("documentos").select("id, prospecto_id, nombre, tipo_doc, file_path, mime, tamano_bytes, created_at").order("created_at", { ascending: false });
  if (prospectoId) consulta = consulta.eq("prospecto_id", prospectoId);
  const { data, error } = await consulta;
  if (error) throw new ErrorDatos(`No se pudieron cargar los documentos: ${error.message}`);
  return (data ?? []).map(aDocumento);
}

export async function subirDocumento(prospectoId: string, tipo: TipoDocumento, archivo: File): Promise<Documento> {
  const motivo = archivoAceptado(archivo);
  if (motivo) throw new ErrorDatos(motivo);

  const sb = getSupabase();
  const { data: sesion } = await sb.auth.getUser();
  const asesorId = sesion.user?.id;
  if (!asesorId) throw new ErrorDatos("Sesión vencida");

  const path = `${asesorId}/${prospectoId}/${crypto.randomUUID()}-${nombreSeguro(archivo.name)}`;
  const { error: subida } = await sb.storage.from(BUCKET_DOCUMENTOS).upload(path, archivo, {
    contentType: archivo.type,
    upsert: false,
  });
  if (subida) throw new ErrorDatos(`No se pudo subir el archivo: ${subida.message}`);

  const { data, error } = await sb
    .from("documentos")
    .insert({
      prospecto_id: prospectoId,
      nombre: archivo.name.slice(0, 180),
      tipo_doc: tipo,
      file_path: path,
      mime: archivo.type,
      tamano_bytes: archivo.size,
    })
    .select("id, prospecto_id, nombre, tipo_doc, file_path, mime, tamano_bytes, created_at")
    .single();
  if (error || !data) {
    await sb.storage.from(BUCKET_DOCUMENTOS).remove([path]);
    throw new ErrorDatos(`No se pudo registrar el documento: ${error?.message ?? "sin respuesta"}`);
  }
  return aDocumento(data);
}

export async function urlDocumento(filePath: string): Promise<string> {
  const { data, error } = await getSupabase().storage.from(BUCKET_DOCUMENTOS).createSignedUrl(filePath, 120);
  if (error || !data) throw new ErrorDatos(`No se pudo abrir el archivo: ${error?.message ?? "sin respuesta"}`);
  return data.signedUrl;
}

export async function eliminarDocumento(documento: Pick<Documento, "id" | "filePath">): Promise<void> {
  const sb = getSupabase();
  const { error: archivo } = await sb.storage.from(BUCKET_DOCUMENTOS).remove([documento.filePath]);
  if (archivo) throw new ErrorDatos(`No se pudo borrar el archivo: ${archivo.message}`);
  const { error } = await sb.from("documentos").delete().eq("id", documento.id);
  if (error) throw new ErrorDatos(`No se pudo borrar el documento: ${error.message}`);
}

/** Borra los archivos del prospecto antes de eliminar la ficha. Si el vault no existe, no interrumpe. */
export async function borrarArchivosDeProspecto(prospectoId: string): Promise<void> {
  const sb = getSupabase();
  const { data, error } = await sb.from("documentos").select("file_path").eq("prospecto_id", prospectoId);
  if (error) return;
  const paths = (data ?? []).map((fila) => fila.file_path);
  if (paths.length === 0) return;
  await sb.storage.from(BUCKET_DOCUMENTOS).remove(paths);
}
