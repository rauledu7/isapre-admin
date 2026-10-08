import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { supabaseEnv } from "./env";

export type Supabase = SupabaseClient<Database>;

let cliente: Supabase | undefined;

export function getSupabase(): Supabase {
  if (!cliente) {
    const { url, key } = supabaseEnv();
    cliente = createBrowserClient<Database>(url, key);
  }
  return cliente;
}
