import { create } from "zustand";

import type { CargaForm, ClienteForm, PlanForm } from "@/types/cotizador";

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
  gesUF: "",
  caecUF: "",
  seguroUF: "",
});

interface CotizadorState {
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
}

export const useCotizadorStore = create<CotizadorState>()((set) => ({
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
  reiniciar: () => set({ cliente: clienteInicial(), cargas: [], planes: [planVacio()] }),
}));
