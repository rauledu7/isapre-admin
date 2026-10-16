import { NextResponse } from "next/server";

import { esSuperAdmin } from "@/lib/superAdmin";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getClaims();
  return NextResponse.json({ superAdmin: esSuperAdmin(data?.claims.email) });
}
