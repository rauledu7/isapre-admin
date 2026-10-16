"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase/client";

import { Brand } from "../layout/Brand";

export function AdminBarra() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    void getSupabase()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function cerrarSesion() {
    await getSupabase().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center gap-3 border-b px-4 py-3 md:px-6">
      <Brand />
      <p className="text-sm text-muted-foreground">Administración</p>
      <div className="ml-auto flex items-center gap-2">
        {email && <span className="hidden max-w-56 truncate text-xs text-muted-foreground sm:inline">{email}</span>}
        <Button variant="ghost" size="icon" aria-label="Cerrar sesión" onClick={() => void cerrarSesion()}>
          <LogOutIcon />
        </Button>
      </div>
    </header>
  );
}
