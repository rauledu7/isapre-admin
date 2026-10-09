"use client";

import { RotateCcwIcon, UserIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useCotizadorStore, useHidratarCotizador } from "@/store/cotizadorStore";
import { useProspectosStore } from "@/store/prospectosStore";

import { DatosClienteCard } from "./DatosClienteCard";
import { PlanesCard } from "./PlanesCard";
import { PropuestaCotizador } from "./PropuestaCotizador";
import { ResultadosPanel } from "./ResultadosPanel";

export function Cotizador() {
  useHidratarCotizador();
  const reiniciar = useCotizadorStore((s) => s.reiniciar);
  const prospectoId = useCotizadorStore((s) => s.prospectoId);
  const prospecto = useProspectosStore((s) => s.prospectos.find((p) => p.id === prospectoId));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Cotizador Rápido</h1>
          <p className="text-sm text-muted-foreground">
            Calcula el 7% legal del cliente en UF y compáralo con el plan actual y las alternativas.
          </p>
        </div>
        <Button variant="outline" className="shrink-0" onClick={reiniciar}>
          <RotateCcwIcon /> Nueva cotización
        </Button>
      </div>
      {prospecto && (
        <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
          <UserIcon className="size-4" aria-hidden />
          Cotizando para{" "}
          <Link href={`/prospectos/${prospecto.id}`} className="font-medium underline">
            {prospecto.nombre}
          </Link>
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <DatosClienteCard />
          <PlanesCard />
        </div>
        <section aria-label="Resultados" className="flex flex-col gap-4">
          <ResultadosPanel />
          <PropuestaCotizador />
        </section>
      </div>
    </div>
  );
}
