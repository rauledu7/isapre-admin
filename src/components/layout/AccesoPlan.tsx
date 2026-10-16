"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { getSupabase } from "@/lib/supabase/client";
import { nivelDeSuscripcion, obtenerSuscripcion } from "@/lib/supabase/suscripciones";
import { permite, type Funcion, type NivelPlan } from "@/lib/suscripcion";

const NivelContext = createContext<NivelPlan | null>(null);

export function AccesoPlanProvider({ children }: { children: React.ReactNode }) {
  const [nivel, setNivel] = useState<NivelPlan | null>(null);

  useEffect(() => {
    let vigente = true;
    const sb = getSupabase();
    void obtenerSuscripcion(sb)
      .then((lectura) => nivelDeSuscripcion(sb, lectura))
      .then((valor) => vigente && setNivel(valor))
      .catch(() => vigente && setNivel("full"));
    return () => {
      vigente = false;
    };
  }, []);

  return <NivelContext.Provider value={nivel}>{children}</NivelContext.Provider>;
}

/** Null mientras carga. */
export function useNivelPlan(): NivelPlan | null {
  return useContext(NivelContext);
}

/** Solo para mostrar u ocultar; el proxy y RLS hacen el bloqueo real. Mientras carga, oculta. */
export function usePermite(funcion: Funcion): boolean {
  const nivel = useNivelPlan();
  return nivel !== null && permite(nivel, funcion);
}

export function SoloConPlan({ funcion, children }: { funcion: Funcion; children: React.ReactNode }) {
  return usePermite(funcion) ? children : null;
}
