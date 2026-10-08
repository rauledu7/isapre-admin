"use client";

import { RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCotizadorStore } from "@/store/cotizadorStore";

import { DatosClienteCard } from "./DatosClienteCard";
import { PlanesCard } from "./PlanesCard";
import { ResultadosPanel } from "./ResultadosPanel";

export function Cotizador() {
  const reiniciar = useCotizadorStore((s) => s.reiniciar);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <DatosClienteCard />
        <PlanesCard />
        <Button variant="ghost" className="self-start" onClick={reiniciar}>
          <RotateCcwIcon /> Nueva cotización
        </Button>
      </div>
      <section aria-label="Resultados">
        <ResultadosPanel />
      </section>
    </div>
  );
}
