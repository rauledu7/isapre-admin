export interface EnvPublico {
  url: string;
  key: string;
  vapid: string;
}

declare global {
  interface Window {
    __ISAPRE_ENV__?: EnvPublico;
  }
}

function leer(nombre: string): string {
  const valor = process.env[nombre];
  return typeof valor === "string" ? valor.trim() : "";
}

/** En el servidor lee el entorno del proceso. En el navegador, lo que inyecta el layout. */
export function envPublico(): EnvPublico {
  if (typeof window !== "undefined" && window.__ISAPRE_ENV__) return window.__ISAPRE_ENV__;
  return {
    url: leer("NEXT_PUBLIC_SUPABASE_URL"),
    key: leer("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    vapid: leer("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
  };
}

export function supabaseEnv(): { url: string; key: string } {
  const { url, key } = envPublico();
  if (!url || !key) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }
  return { url, key };
}
