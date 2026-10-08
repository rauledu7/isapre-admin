import { create } from "zustand";

import { intercambiarOrden, siguienteOrden } from "@/lib/embudo";
import { fechaHoy } from "@/lib/fecha";
import { cierreAlCambiarEtapa, cierreAlCrear } from "@/lib/metas";
import type { ProspectoDatos } from "@/lib/prospectoForm";
import { getSupabase } from "@/lib/supabase/client";
import * as db from "@/lib/supabase/prospectos";
import type { EtapaEmbudo, Prospecto, TipoEtapa } from "@/types/isapre";

type EstadoCarga = "inicial" | "cargando" | "listo" | "error";

interface ProspectosState {
  estado: EstadoCarga;
  error: string | null;
  etapas: EtapaEmbudo[];
  prospectos: Prospecto[];
  cargar: (forzar?: boolean) => Promise<void>;
  crearProspecto: (datos: ProspectoDatos) => Promise<Prospecto>;
  actualizarProspecto: (id: string, cambios: Partial<ProspectoDatos>) => Promise<Prospecto>;
  moverProspecto: (id: string, etapaId: string) => Promise<void>;
  eliminarProspecto: (id: string) => Promise<void>;
  crearEtapa: (nombre: string, tipo: TipoEtapa) => Promise<void>;
  actualizarEtapa: (id: string, cambios: Partial<Pick<EtapaEmbudo, "nombre" | "tipo">>) => Promise<void>;
  reordenarEtapa: (id: string, direccion: -1 | 1) => Promise<void>;
  eliminarEtapa: (id: string) => Promise<void>;
  limpiar: () => void;
}

const mensaje = (e: unknown) => (e instanceof Error ? e.message : "Error inesperado");

const reemplazar = (lista: Prospecto[], p: Prospecto) => lista.map((x) => (x.id === p.id ? p : x));

export const useProspectosStore = create<ProspectosState>()((set, get) => ({
  estado: "inicial",
  error: null,
  etapas: [],
  prospectos: [],

  cargar: async (forzar = false) => {
    if (!forzar && (get().estado === "cargando" || get().estado === "listo")) return;
    set({ estado: "cargando", error: null });
    try {
      const sb = getSupabase();
      const [etapas, prospectos] = await Promise.all([db.listarEtapas(sb), db.listarProspectos(sb)]);
      set({ etapas, prospectos, estado: "listo" });
    } catch (e) {
      set({ estado: "error", error: mensaje(e) });
    }
  },

  crearProspecto: async (datos) => {
    const cerradoEn = datos.cerradoEn ?? cierreAlCrear(datos.etapaId, get().etapas, fechaHoy(new Date()));
    const p = await db.crearProspecto(getSupabase(), { ...datos, cerradoEn });
    set((s) => ({ prospectos: [p, ...s.prospectos] }));
    return p;
  },

  actualizarProspecto: async (id, cambios) => {
    const anterior = get().prospectos.find((p) => p.id === id);
    const cierre =
      anterior && cambios.etapaId
        ? cierreAlCambiarEtapa(anterior, cambios.etapaId, get().etapas, fechaHoy(new Date()))
        : null;
    const p = await db.actualizarProspecto(getSupabase(), id, cierre ? { ...cambios, ...cierre } : cambios);
    set((s) => ({ prospectos: reemplazar(s.prospectos, p) }));
    return p;
  },

  moverProspecto: async (id, etapaId) => {
    const anterior = get().prospectos.find((p) => p.id === id);
    if (!anterior || anterior.etapaId === etapaId) return;
    const cierre = cierreAlCambiarEtapa(anterior, etapaId, get().etapas, fechaHoy(new Date()));
    const cambios = { etapaId, ...cierre };
    set((s) => ({ prospectos: reemplazar(s.prospectos, { ...anterior, ...cambios }) }));
    try {
      const p = await db.actualizarProspecto(getSupabase(), id, cambios);
      set((s) => ({ prospectos: reemplazar(s.prospectos, p) }));
    } catch (e) {
      set((s) => ({ prospectos: reemplazar(s.prospectos, anterior), error: mensaje(e) }));
    }
  },

  eliminarProspecto: async (id) => {
    await db.eliminarProspecto(getSupabase(), id);
    set((s) => ({ prospectos: s.prospectos.filter((p) => p.id !== id) }));
  },

  crearEtapa: async (nombre, tipo) => {
    const etapa = await db.crearEtapa(getSupabase(), {
      nombre,
      tipo,
      orden: siguienteOrden(get().etapas),
    });
    set((s) => ({ etapas: [...s.etapas, etapa] }));
  },

  actualizarEtapa: async (id, cambios) => {
    await db.actualizarEtapa(getSupabase(), id, cambios);
    set((s) => ({ etapas: s.etapas.map((e) => (e.id === id ? { ...e, ...cambios } : e)) }));
  },

  reordenarEtapa: async (id, direccion) => {
    const cambios = intercambiarOrden(get().etapas, id, direccion);
    if (cambios.length === 0) return;
    const sb = getSupabase();
    await Promise.all(cambios.map((e) => db.actualizarEtapa(sb, e.id, { orden: e.orden })));
    set((s) => ({
      etapas: s.etapas.map((e) => cambios.find((c) => c.id === e.id) ?? e),
    }));
  },

  eliminarEtapa: async (id) => {
    if (get().prospectos.some((p) => p.etapaId === id)) {
      throw new Error("Mueve los prospectos de esta etapa antes de eliminarla");
    }
    await db.eliminarEtapa(getSupabase(), id);
    set((s) => ({ etapas: s.etapas.filter((e) => e.id !== id) }));
  },

  limpiar: () => set({ estado: "inicial", error: null, etapas: [], prospectos: [] }),
}));
