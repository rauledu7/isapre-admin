"use client";

import { useEffect, useState } from "react";

import { getSupabase } from "@/lib/supabase/client";
import { listarPlanes, obtenerSuscripcion } from "@/lib/supabase/suscripciones";
import { diasRestantesTrial, suscripcionVigente, type PlanPago, type Suscripcion } from "@/lib/suscripcion";

export type EstadoUseSubscription =
  | { cargando: true }
  | { cargando: false; error: string }
  | {
      cargando: false;
      error: null;
      suscripcion: Suscripcion | null;
      planes: PlanPago[];
      vigente: boolean;
      diasTrial: number | null;
    };

/** Suscripción del asesor y planes disponibles. Sin la tabla creada, se considera vigente. */
export function useSubscription(): EstadoUseSubscription {
  const [estado, setEstado] = useState<EstadoUseSubscription>({ cargando: true });

  useEffect(() => {
    let vigente = true;
    const sb = getSupabase();
    void Promise.all([obtenerSuscripcion(sb), listarPlanes(sb)])
      .then(([lectura, planes]) => {
        if (!vigente) return;
        const ahora = new Date();
        const suscripcion = lectura.tablaFalta ? null : lectura.suscripcion;
        setEstado({
          cargando: false,
          error: null,
          suscripcion,
          planes,
          vigente: lectura.tablaFalta || suscripcionVigente(suscripcion, ahora),
          diasTrial: diasRestantesTrial(suscripcion, ahora),
        });
      })
      .catch((e: unknown) => {
        if (vigente) setEstado({ cargando: false, error: e instanceof Error ? e.message : "No se pudo cargar la suscripción." });
      });
    return () => {
      vigente = false;
    };
  }, []);

  return estado;
}
