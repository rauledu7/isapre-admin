"use client";

import { RotateCcwIcon, UserIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useCotizadorStore } from "@/store/cotizadorStore";
import { useProspectosStore } from "@/store/prospectosStore";

import { DatosClienteCard } from "./DatosClienteCard";
import { PlanesCard } from "./PlanesCard";
import { PropuestaCotizador } from "./PropuestaCotizador";
import { ResultadosPanel } from "./ResultadosPanel";

export function Cotizador() {
  const reiniciar = useCotizadorStore((s) => s.reiniciar);
  const prospectoId = useCotizadorStore((s) => s.prospectoId);
  const prospecto = useProspectosStore((s) => s.prospectos.find((p) => p.id === prospectoId));

  return (
    <div className="flex flex-col gap-4">
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
          <Button variant="ghost" className="self-start" onClick={reiniciar}>
            <RotateCcwIcon /> Nueva cotización
          </Button>
        </div>
        <section aria-label="Resultados" className="flex flex-col gap-4">
          <ResultadosPanel />
          <PropuestaCotizador />
        </section>
      </div>
    </div>
  );
}
