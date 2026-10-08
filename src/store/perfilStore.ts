import { create } from "zustand";

import { getSupabase } from "@/lib/supabase/client";
import * as db from "@/lib/supabase/perfil";
import type { PerfilAsesor } from "@/types/isapre";

interface PerfilState {
  estado: "inicial" | "cargando" | "listo" | "error";
  perfil: PerfilAsesor | null;
  cargar: () => Promise<void>;
  guardar: (perfil: PerfilAsesor) => Promise<void>;
  limpiar: () => void;
}

export const usePerfilStore = create<PerfilState>()((set, get) => ({
  estado: "inicial",
  perfil: null,

  cargar: async () => {
    if (get().estado === "cargando" || get().estado === "listo") return;
    set({ estado: "cargando" });
    try {
      set({ perfil: await db.obtenerPerfil(getSupabase()), estado: "listo" });
    } catch {
      set({ estado: "error" });
    }
  },

  guardar: async (perfil) => {
    set({ perfil: await db.guardarPerfil(getSupabase(), perfil), estado: "listo" });
  },

  limpiar: () => set({ estado: "inicial", perfil: null }),
}));
