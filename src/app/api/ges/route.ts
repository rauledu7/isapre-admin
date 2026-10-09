import { NextResponse } from "next/server";

import { ISAPRES } from "@/config/isapres";
import { parseDecimal } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";
import type { IsapreId } from "@/types/isapre";

function esIsapre(valor: string): valor is IsapreId {
  return ISAPRES.some((isapre) => isapre.id === valor);
}

export async function PUT(request: Request) {
  const sb = await supabaseServer();
  const { data: usuario } = await sb.auth.getUser();
  if (!usuario.user) return NextResponse.json({ error: "Inicia sesión para guardar el GES." }, { status: 401 });

  const cuerpo = (await request.json().catch(() => null)) as { isapreId?: unknown; gesUF?: unknown } | null;
  const isapreId = typeof cuerpo?.isapreId === "string" ? cuerpo.isapreId : "";
  const gesUF = typeof cuerpo?.gesUF === "number" ? cuerpo.gesUF : parseDecimal(String(cuerpo?.gesUF ?? ""));
  if (!esIsapre(isapreId)) return NextResponse.json({ error: "Elige la Isapre." }, { status: 400 });
  if (gesUF === null || gesUF <= 0 || gesUF >= 20) {
    return NextResponse.json({ error: "El GES tiene que ser un monto en UF mayor que 0 y menor que 20." }, { status: 400 });
  }

  const { error } = await sb.from("ges_isapres").upsert(
    { asesor_id: usuario.user.id, isapre_id: isapreId, ges_uf: gesUF },
    { onConflict: "asesor_id,isapre_id" },
  );
  if (error?.code === "42P01" || error?.code === "PGRST205") {
    return NextResponse.json({ error: "Falta correr la migración del GES." }, { status: 503 });
  }
  if (error) return NextResponse.json({ error: "No se pudo guardar el GES." }, { status: 500 });

  return NextResponse.json({ gesUF });
}
