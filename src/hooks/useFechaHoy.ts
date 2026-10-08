"use client";

import { useSyncExternalStore } from "react";

import { fechaHoy } from "@/lib/fecha";

function suscribir(): () => void {
  return () => undefined;
}

/** Día en Chile. En el servidor es `null` para no leer el reloj durante el prerender. */
export function useFechaHoy(): string | null {
  return useSyncExternalStore(suscribir, () => fechaHoy(new Date()), () => null);
}
