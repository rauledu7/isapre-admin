import type { PerfilAsesor } from "@/types/isapre";

import type { Supabase } from "./client";
import { ErrorDatos } from "./prospectos";

export async function obtenerPerfil(sb: Supabase): Promise<PerfilAsesor | null> {
  const { data, error } = await sb.from("perfiles_asesor").select("nombre, telefono, email").maybeSingle();
  if (error) throw new ErrorDatos(`No se pudo cargar tu perfil: ${error.message}`);
  return data;
}

export async function guardarPerfil(sb: Supabase, perfil: PerfilAsesor): Promise<PerfilAsesor> {
  const { data, error } = await sb
    .from("perfiles_asesor")
    .upsert(perfil, { onConflict: "asesor_id" })
    .select("nombre, telefono, email")
    .single();
  if (error) throw new ErrorDatos(`No se pudo guardar tu perfil: ${error.message}`);
  return data;
}
