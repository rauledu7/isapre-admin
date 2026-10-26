"use client";

import { useEffect, useState } from "react";

import { getSupabase } from "@/lib/supabase/client";
import { listarGesIsapres } from "@/lib/supabase/ges";
import type { IsapreId } from "@/types/isapre";

/** GES guardado por el asesor. Vacío usa el valor inicial de cada Isapre. */
export function useGesIsapres(): { valores: Partial<Record<IsapreId, number>>; listo: boolean } {
  const [valores, setValores] = useState<Partial<Record<IsapreId, number>>>({});
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let vigente = true;
    void listarGesIsapres(getSupabase())
      .then((mapa) => {
        if (!vigente) return;
        setValores(mapa);
      })
      .catch(() => {
        if (!vigente) return;
        setValores({});
      })
      .finally(() => {
        if (vigente) setListo(true);
      });
    return () => {
      vigente = false;
    };
  }, []);

  return { valores, listo };
}
