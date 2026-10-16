"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { getSupabase } from "@/lib/supabase/client";
import { nivelDeSuscripcion, obtenerSuscripcion } from "@/lib/supabase/suscripciones";
import { permite, type Funcion, type NivelPlan } from "@/lib/suscripcion";

const NivelContext = createContext<NivelPlan | null>(null);
const SuperAdminContext = createContext(false);

export function AccesoPlanProvider({ children }: { children: React.ReactNode }) {
  const [nivel, setNivel] = useState<NivelPlan | null>(null);
  const [superAdmin, setSuperAdmin] = useState(false);

  useEffect(() => {
    let vigente = true;
    const sb = getSupabase();
    void obtenerSuscripcion(sb)
      .then((lectura) => nivelDeSuscripcion(sb, lectura))
      .then((valor) => vigente && setNivel(valor))
      .catch(() => vigente && setNivel("full"));
    void fetch("/api/cuenta/acceso")
      .then((r): Promise<{ superAdmin?: boolean }> | { superAdmin?: boolean } => (r.ok ? r.json() : {}))
      .then((cuerpo) => vigente && setSuperAdmin(cuerpo.superAdmin === true))
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, []);

  return (
    <SuperAdminContext.Provider value={superAdmin}>
      <NivelContext.Provider value={nivel}>{children}</NivelContext.Provider>
    </SuperAdminContext.Provider>
  );
}

/** Null mientras carga. */
export function useNivelPlan(): NivelPlan | null {
  return useContext(NivelContext);
}

/** Solo para mostrar el acceso al panel; el proxy y cada ruta de admin lo verifican en el servidor. */
export function useEsSuperAdmin(): boolean {
  return useContext(SuperAdminContext);
}

/** Solo para mostrar u ocultar; el proxy y RLS hacen el bloqueo real. Mientras carga, oculta. */
export function usePermite(funcion: Funcion): boolean {
  const nivel = useNivelPlan();
  return nivel !== null && permite(nivel, funcion);
}

export function SoloConPlan({ funcion, children }: { funcion: Funcion; children: React.ReactNode }) {
  return usePermite(funcion) ? children : null;
}
