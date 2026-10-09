"use client";

import { useEffect, useState } from "react";

import { getSupabase } from "@/lib/supabase/client";
import { listarGesIsapres } from "@/lib/supabase/ges";
import type { IsapreId } from "@/types/isapre";

/** GES guardado por el asesor. Vacío usa el valor inicial de cada Isapre. */
export function useGesIsapres(): Partial<Record<IsapreId, number>> {
  const [ges, setGes] = useState<Partial<Record<IsapreId, number>>>({});

  useEffect(() => {
    let vigente = true;
    void listarGesIsapres(getSupabase())
      .then((mapa) => vigente && setGes(mapa))
      .catch(() => vigente && setGes({}));
    return () => {
      vigente = false;
    };
  }, []);

  return ges;
}
