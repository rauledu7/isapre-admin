import "server-only";

import type { AsesorAdmin, PagoAdmin } from "@/lib/adminAsesores";
import { esSuperAdmin } from "@/lib/superAdmin";
import { aSuscripcion, type PlanPago } from "@/lib/suscripcion";

import type { Supabase } from "./client";
import { ErrorDatos } from "./prospectos";
import { supabaseAdmin, supabaseServer } from "./server";
import { listarPlanes } from "./suscripciones";

/** Cliente service role solo si quien llama es el super admin. */
export async function clienteSuperAdmin(): Promise<{ admin: Supabase } | { error: string; status: 403 | 503 }> {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getClaims();
  if (!esSuperAdmin(data?.claims.email)) return { error: "No autorizado", status: 403 };
  const admin = supabaseAdmin();
  return admin ? { admin } : { error: "Falta SUPABASE_SERVICE_ROLE_KEY", status: 503 };
}

async function listarUsuarios(admin: Supabase) {
  const usuarios = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new ErrorDatos(`No se pudieron cargar los usuarios: ${error.message}`);
    usuarios.push(...data.users);
    if (data.users.length < 1000) return usuarios;
  }
}

export interface DatosAdmin {
  asesores: AsesorAdmin[];
  pagos: PagoAdmin[];
  planes: PlanPago[];
}

export async function datosAdmin(admin: Supabase): Promise<DatosAdmin> {
  const [usuarios, perfiles, suscripciones, pagos, planes] = await Promise.all([
    listarUsuarios(admin),
    admin.from("perfiles_asesor").select("asesor_id, nombre"),
    admin
      .from("suscripciones")
      .select("perfil_id, estado, plan_id, periodo, fecha_fin_trial, fecha_proximo_pago, bloqueado_en"),
    admin.from("pagos").select("monto_clp, estado, fecha"),
    listarPlanes(admin),
  ]);
  for (const { error } of [perfiles, suscripciones, pagos]) {
    if (error) throw new ErrorDatos(`No se pudieron cargar los datos: ${error.message}`);
  }

  const nombres = new Map((perfiles.data ?? []).map((p) => [p.asesor_id, p.nombre]));
  const porPerfil = new Map((suscripciones.data ?? []).map((s) => [s.perfil_id, s]));
  const nombrePlan = new Map(planes.map((p) => [p.id, p.nombre]));

  const asesores = usuarios
    .map((u): AsesorAdmin => {
      const fila = porPerfil.get(u.id);
      const suscripcion = fila ? aSuscripcion(fila) : null;
      return {
        id: u.id,
        email: u.email ?? null,
        nombre: nombres.get(u.id) ?? null,
        creadoEn: u.created_at,
        ultimoIngreso: u.last_sign_in_at ?? null,
        suscripcion,
        planNombre: suscripcion?.planId ? (nombrePlan.get(suscripcion.planId) ?? null) : null,
      };
    })
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));

  return {
    asesores,
    pagos: (pagos.data ?? []).map((p) => ({ montoCLP: p.monto_clp, estado: p.estado, fecha: p.fecha })),
    planes,
  };
}
