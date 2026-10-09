import { NextResponse } from "next/server";

import { enviarPush } from "@/lib/alertasServidor";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getClaims();
  const asesorId = data?.claims.sub;
  if (!asesorId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const cuerpo = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(cuerpo?.ids) ? cuerpo.ids.filter((id): id is string => typeof id === "string").slice(0, 20) : [];
  if (ids.length === 0) return NextResponse.json({ enviadas: 0 });

  const { data: filas, error } = await sb
    .from("notificaciones")
    .select("titulo, cuerpo, prospecto_id")
    .in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await enviarPush(
    sb,
    asesorId,
    (filas ?? []).map((fila) => ({
      titulo: fila.titulo,
      cuerpo: fila.cuerpo,
      url: fila.prospecto_id ? `/prospectos/${fila.prospecto_id}` : "/",
    })),
  );
  return NextResponse.json({ enviadas: filas?.length ?? 0 });
}
