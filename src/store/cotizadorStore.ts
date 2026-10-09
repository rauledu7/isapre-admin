import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { formatEnteroInput } from "@/lib/format";
import type { CargaForm, ClienteForm, PlanForm } from "@/types/cotizador";
import type { Prospecto } from "@/types/isapre";

export const MAX_PLANES = 3;

let secuencia = 0;
// crypto.randomUUID no existe fuera de contextos seguros (p. ej. probar desde el celular por IP local).
const nuevoId = (prefijo: string) => `${prefijo}-${Date.now()}-${++secuencia}`;

const clienteInicial = (): ClienteForm => ({
  rentaImponibleCLP: "",
  edadTitular: "",
  isapreActual: null,
  precioPlanActualUF: "",
});

const planVacio = (): PlanForm => ({
  id: nuevoId("plan"),
  isapreId: null,
  nombre: "",
  precioBaseUF: "",
  seguroUF: "",
  codigoTarifa: null,
  productosTarifa: [],
  incluyeConsulta: false,
});

interface CotizadorState {
  /** Prospecto al que se asociará la cotización al guardarla. */
  prospectoId: string | null;
  cliente: ClienteForm;
  cargas: CargaForm[];
  planes: PlanForm[];
  actualizarCliente: (cambios: Partial<ClienteForm>) => void;
  agregarCarga: () => void;
  actualizarCarga: (id: string, edad: string) => void;
  eliminarCarga: (id: string) => void;
  agregarPlan: () => void;
  actualizarPlan: (id: string, cambios: Partial<Omit<PlanForm, "id">>) => void;
  eliminarPlan: (id: string) => void;
  reiniciar: () => void;
  cargarDesdeProspecto: (prospecto: Prospecto) => void;
  asociarProspecto: (prospectoId: string | null) => void;
}

export const useCotizadorStore = create<CotizadorState>()(
  persist(
    (set) => ({
  prospectoId: null,
  cliente: clienteInicial(),
  cargas: [],
  planes: [planVacio()],
  actualizarCliente: (cambios) => set((s) => ({ cliente: { ...s.cliente, ...cambios } })),
  agregarCarga: () =>
    set((s) => ({ cargas: [...s.cargas, { id: nuevoId("carga"), edad: "" }] })),
  actualizarCarga: (id, edad) =>
    set((s) => ({ cargas: s.cargas.map((c) => (c.id === id ? { ...c, edad } : c)) })),
  eliminarCarga: (id) => set((s) => ({ cargas: s.cargas.filter((c) => c.id !== id) })),
  agregarPlan: () =>
    set((s) => (s.planes.length >= MAX_PLANES ? s : { planes: [...s.planes, planVacio()] })),
  actualizarPlan: (id, cambios) =>
    set((s) => ({ planes: s.planes.map((p) => (p.id === id ? { ...p, ...cambios } : p)) })),
  eliminarPlan: (id) =>
    set((s) => (s.planes.length <= 1 ? s : { planes: s.planes.filter((p) => p.id !== id) })),
  reiniciar: () =>
    set({ prospectoId: null, cliente: clienteInicial(), cargas: [], planes: [planVacio()] }),
  cargarDesdeProspecto: (p) =>
    set({
      prospectoId: p.id,
      cliente: {
        rentaImponibleCLP:
          p.rentaImponibleCLP === null ? "" : formatEnteroInput(String(p.rentaImponibleCLP)),
        edadTitular: p.edad?.toString() ?? "",
        isapreActual: p.isapreActual,
        precioPlanActualUF: "",
      },
      cargas: p.cargas.map((edad) => ({ id: nuevoId("carga"), edad: String(edad) })),
      planes: [planVacio()],
    }),
  asociarProspecto: (prospectoId) => set({ prospectoId }),
    }),
    {
      // sessionStorage: sobrevive a recargas (p. ej. volver desde WhatsApp en el celular)
      // pero se borra al cerrar la pestaña. Contiene renta del cliente: no usar localStorage.
      name: "isapre-cotizador",
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ prospectoId, cliente, cargas, planes }) => ({ prospectoId, cliente, cargas, planes }),
      // Se rehidrata en el cliente tras montar, para no romper la hidratación del HTML del servidor.
      skipHydration: true,
    },
  ),
);

/** Rehidrata el Cotizador desde sessionStorage; devuelve `true` cuando el estado está listo. */
export function useHidratarCotizador(): boolean {
  // En el servidor no hay sessionStorage y zustand no adjunta la API `persist`.
  const [listo, setListo] = useState(
    () => (useCotizadorStore.persist as typeof useCotizadorStore.persist | undefined)?.hasHydrated() ?? false,
  );
  useEffect(() => {
    const desuscribir = useCotizadorStore.persist.onFinishHydration(() => setListo(true));
    void useCotizadorStore.persist.rehydrate();
    return desuscribir;
  }, []);
  return listo;
}
