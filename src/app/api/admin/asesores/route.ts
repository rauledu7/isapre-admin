import { NextResponse } from "next/server";

import { clienteSuperAdmin, datosAdmin } from "@/lib/supabase/adminAsesores";

export async function GET() {
  const acceso = await clienteSuperAdmin();
  if ("error" in acceso) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  try {
    return NextResponse.json(await datosAdmin(acceso.admin));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudieron cargar los datos." }, { status: 500 });
  }
}
