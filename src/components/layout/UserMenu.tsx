"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase/client";
import { useCotizadorStore } from "@/store/cotizadorStore";
import { useProspectosStore } from "@/store/prospectosStore";

export function UserMenu() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    getSupabase()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function cerrarSesion() {
    await getSupabase().auth.signOut();
    useProspectosStore.getState().limpiar();
    useCotizadorStore.getState().reiniciar();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {email && (
        <span className="hidden max-w-40 truncate text-xs text-muted-foreground lg:inline">
          {email}
        </span>
      )}
      <Button variant="ghost" size="icon" aria-label="Cerrar sesión" onClick={cerrarSesion}>
        <LogOutIcon />
      </Button>
    </div>
  );
}
