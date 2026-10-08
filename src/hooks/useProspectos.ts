"use client";

import { useEffect } from "react";

import { useProspectosStore } from "@/store/prospectosStore";

export function useProspectos() {
  const cargar = useProspectosStore((s) => s.cargar);
  const estado = useProspectosStore((s) => s.estado);
  const error = useProspectosStore((s) => s.error);
  const etapas = useProspectosStore((s) => s.etapas);
  const prospectos = useProspectosStore((s) => s.prospectos);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return { estado, error, etapas, prospectos, recargar: () => cargar(true) };
}
