import type { Database } from "@/types/database";
import type { PerfilAsesor } from "@/types/isapre";

import type { Supabase } from "./client";
import { ErrorDatos } from "./prospectos";

type FilaPerfil = Pick<
  Database["public"]["Tables"]["perfiles_asesor"]["Row"],
  "nombre" | "telefono" | "email" | "meta_uf_mes" | "meta_contratos_mes" | "sitio_web"
>;

const COLUMNAS = "nombre, telefono, email, meta_uf_mes, meta_contratos_mes, sitio_web";

function aPerfil(fila: FilaPerfil): PerfilAsesor {
  return {
    nombre: fila.nombre,
    telefono: fila.telefono,
    email: fila.email,
    metaUfMes: fila.meta_uf_mes === null ? null : Number(fila.meta_uf_mes),
    metaContratosMes: fila.meta_contratos_mes,
    sitioWeb: fila.sitio_web,
  };
}

const COLUMNAS_SIN_SITIO = "nombre, telefono, email, meta_uf_mes, meta_contratos_mes";

export async function obtenerPerfil(sb: Supabase): Promise<PerfilAsesor | null> {
  const { data, error } = await sb.from("perfiles_asesor").select(COLUMNAS).maybeSingle();
  if (error?.code === "42703") {
    const anterior = await sb.from("perfiles_asesor").select(COLUMNAS_SIN_SITIO).maybeSingle();
    if (anterior.error) throw new ErrorDatos(`No se pudo cargar tu perfil: ${anterior.error.message}`);
    return anterior.data ? aPerfil({ ...anterior.data, sitio_web: null }) : null;
  }
  if (error) throw new ErrorDatos(`No se pudo cargar tu perfil: ${error.message}`);
  return data ? aPerfil(data) : null;
}

export async function guardarPerfil(sb: Supabase, perfil: PerfilAsesor): Promise<PerfilAsesor> {
  const { data, error } = await sb
    .from("perfiles_asesor")
    .upsert(
      {
        nombre: perfil.nombre,
        telefono: perfil.telefono,
        email: perfil.email,
        meta_uf_mes: perfil.metaUfMes,
        meta_contratos_mes: perfil.metaContratosMes,
        sitio_web: perfil.sitioWeb,
      },
      { onConflict: "asesor_id" },
    )
    .select(COLUMNAS)
    .single();
  if (error?.code === "23505") throw new ErrorDatos("Esa página ya está vinculada a otro asesor.");
  if (error) throw new ErrorDatos(`No se pudo guardar tu perfil: ${error.message}`);
  return aPerfil(data);
}
