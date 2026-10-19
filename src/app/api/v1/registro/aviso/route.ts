import { NextResponse } from "next/server";

import { PLANES_PUBLICOS } from "@/config/planesPublicos";
import { enviarPush } from "@/lib/alertasServidor";
import { textoAvisoRegistro } from "@/lib/registro";
import { esSuperAdmin } from "@/lib/superAdmin";
import { supabaseAdmin } from "@/lib/supabase/server";

const VENTANA_MS = 15 * 60 * 1000;

function emailValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor) && valor.length <= 200;
}

export async function POST(request: Request) {
  const cuerpo = (await request.json().catch(() => null)) as {
    email?: unknown;
    nombre?: unknown;
    modo?: unknown;
    plan?: unknown;
  } | null;
  const email = typeof cuerpo?.email === "string" ? cuerpo.email.trim().toLowerCase() : "";
  if (!emailValido(email)) return NextResponse.json({ error: "Falta el correo." }, { status: 400 });

  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "No se pudo avisar el registro." }, { status: 503 });

  const nombre = typeof cuerpo?.nombre === "string" ? cuerpo.nombre.trim().slice(0, 120) : "";
  const planNombre = PLANES_PUBLICOS.find((plan) => plan.nombre === cuerpo?.plan)?.nombre ?? null;
  const modo = cuerpo?.modo === "plan" && planNombre ? "plan" : "trial";

  try {
    const nuevo = await usuarioPorEmail(admin, email);
    const creado = nuevo ? new Date(nuevo.created_at).getTime() : 0;
    if (!nuevo || Number.isNaN(creado) || Date.now() - creado > VENTANA_MS || esSuperAdmin(nuevo.email)) {
      return NextResponse.json({ ok: true });
    }

    const dueno = await usuarioPorEmail(admin, process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase() ?? "");
    if (!dueno) return NextResponse.json({ ok: true });

    const aviso = textoAvisoRegistro({ nombre, email, modo, plan: planNombre });
    const { error } = await admin.from("notificaciones").insert({
      asesor_id: dueno.id,
      tipo: "registro",
      titulo: aviso.titulo,
      cuerpo: aviso.cuerpo,
      dedup: `registro:${nuevo.id}`,
    });
    if (error?.code === "23505") return NextResponse.json({ ok: true });
    if (error) {
      console.error("aviso registro", error.message);
      return NextResponse.json({ error: "No se pudo avisar el registro." }, { status: 500 });
    }

    await enviarPush(admin, dueno.id, [{ titulo: aviso.titulo, cuerpo: aviso.cuerpo, url: "/admin" }]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("aviso registro", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "No se pudo avisar el registro." }, { status: 500 });
  }
}

async function usuarioPorEmail(admin: NonNullable<ReturnType<typeof supabaseAdmin>>, email: string) {
  if (!email) return null;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const encontrado = data.users.find((usuario) => usuario.email?.toLowerCase() === email);
    if (encontrado) return encontrado;
    if (data.users.length < 200) return null;
  }
}
