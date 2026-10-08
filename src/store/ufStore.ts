import { create } from "zustand";

import type { ValorUF } from "@/types/isapre";

interface UFState {
  inicializado: boolean;
  oficial: ValorUF | null;
  /** Solo se usa cuando no se pudo obtener la UF oficial. */
  manual: ValorUF | null;
  setOficial: (valor: ValorUF | null) => void;
  setManual: (valor: number | null) => void;
}

const hoyChile = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date());

export const useUFStore = create<UFState>()((set) => ({
  inicializado: false,
  oficial: null,
  manual: null,
  setOficial: (oficial) => set({ oficial, inicializado: true }),
  setManual: (valor) =>
    set({ manual: valor === null ? null : { valor, fecha: hoyChile(), fuente: "manual" } }),
}));

export const useValorUF = () => useUFStore((s) => s.oficial ?? s.manual);
