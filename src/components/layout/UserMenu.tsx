"use client";

import { LogOutIcon, UserPenIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase/client";
import { useCotizadorStore } from "@/store/cotizadorStore";
import { usePerfilStore } from "@/store/perfilStore";
import { useProspectosStore } from "@/store/prospectosStore";

import { PerfilDialog } from "./PerfilDialog";

export function UserMenu() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const cargarPerfil = usePerfilStore((s) => s.cargar);

  useEffect(() => {
    getSupabase()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
    void cargarPerfil();
  }, [cargarPerfil]);

  async function cerrarSesion() {
    await getSupabase().auth.signOut();
    useProspectosStore.getState().limpiar();
    useCotizadorStore.getState().reiniciar();
    usePerfilStore.getState().limpiar();
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
      <Button variant="ghost" size="icon" aria-label="Mis datos de asesor" onClick={() => setPerfilAbierto(true)}>
        <UserPenIcon />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Cerrar sesión" onClick={cerrarSesion}>
        <LogOutIcon />
      </Button>
      <PerfilDialog open={perfilAbierto} onOpenChange={setPerfilAbierto} />
    </div>
  );
}
