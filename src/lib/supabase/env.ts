// Referencias literales: Next solo inyecta en el cliente las variables NEXT_PUBLIC_ escritas así.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function supabaseEnv(): { url: string; key: string } {
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local",
    );
  }
  return { url, key };
}
