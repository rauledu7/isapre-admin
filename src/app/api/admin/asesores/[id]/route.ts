import { NextResponse } from "next/server";

import { finTrialExtendido } from "@/lib/adminAsesores";
import { clienteSuperAdmin } from "@/lib/supabase/adminAsesores";
import type { Database } from "@/types/database";

type CambiosSuscripcion = Database["public"]["Tables"]["suscripciones"]["Update"];

const ACCIONES = ["extender_trial", "activar", "cambiar_plan", "bloquear", "desbloquear"] as const;
type Accion = (typeof ACCIONES)[number];

export async function POST(request: Request, ctx: RouteContext<"/api/admin/asesores/[id]">) {
  const acceso = await clienteSuperAdmin();
  if ("error" in acceso) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  const { admin } = acceso;
  const { id } = await ctx.params;

  const cuerpo = (await request.json().catch(() => null)) as { accion?: unknown; planId?: unknown } | null;
  const accion = ACCIONES.find((a) => a === cuerpo?.accion) as Accion | undefined;
  if (!accion) return NextResponse.json({ error: "Acción desconocida." }, { status: 400 });

  const { data: actual, error: errorLectura } = await admin
    .from("suscripciones")
    .select("estado, fecha_fin_trial")
    .eq("perfil_id", id)
    .maybeSingle();
  if (errorLectura) return NextResponse.json({ error: "No se pudo leer la suscripción." }, { status: 500 });

  let planId: string | null = null;
  if (accion === "activar" || accion === "cambiar_plan") {
    planId = typeof cuerpo?.planId === "string" && cuerpo.planId ? cuerpo.planId : null;
    if (accion === "cambiar_plan" && !planId) return NextResponse.json({ error: "Elige un plan." }, { status: 400 });
    if (planId) {
      const { data: plan } = await admin.from("planes").select("id").eq("id", planId).maybeSingle();
      if (!plan) return NextResponse.json({ error: "Ese plan no existe." }, { status: 400 });
    }
  }

  const ahora = new Date();
  let cambios: CambiosSuscripcion;
  switch (accion) {
    case "extender_trial":
      cambios = {
        fecha_fin_trial: finTrialExtendido(actual?.fecha_fin_trial ?? null, ahora),
        ...(actual?.estado !== "active" && { estado: "trialing" }),
      };
      break;
    case "activar":
      cambios = { estado: "active", plan_id: planId };
      break;
    case "cambiar_plan":
      cambios = { plan_id: planId };
      break;
    case "bloquear":
      cambios = { bloqueado_en: ahora.toISOString() };
      break;
    case "desbloquear":
      cambios = { bloqueado_en: null };
      break;
  }

  const { error } = actual
    ? await admin.from("suscripciones").update(cambios).eq("perfil_id", id)
    : await admin.from("suscripciones").insert({
        perfil_id: id,
        estado: "trialing",
        fecha_fin_trial: finTrialExtendido(null, ahora),
        ...cambios,
      });
  if (error) return NextResponse.json({ error: `No se pudo guardar: ${error.message}` }, { status: 500 });
  return NextResponse.json({ ok: true });
}
