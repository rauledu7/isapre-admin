"use client";

import { TriangleAlertIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { formatCLP, parseMontoCL } from "@/lib/format";
import { useUFStore } from "@/store/ufStore";
import type { ValorUF } from "@/types/isapre";

const ufFormatter = new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatFecha(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}-${mes}-${anio}`;
}

export function UFIndicator({ ufOficial }: { ufOficial: ValorUF | null }) {
  const setOficial = useUFStore((s) => s.setOficial);
  const manual = useUFStore((s) => s.manual);
  const setManual = useUFStore((s) => s.setManual);
  const [texto, setTexto] = useState("");

  useEffect(() => {
    setOficial(ufOficial);
  }, [ufOficial, setOficial]);

  if (ufOficial) {
    return (
      <div className="text-right leading-tight">
        <p className="text-sm font-semibold tabular-nums">
          UF ${ufFormatter.format(ufOficial.valor)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFecha(ufOficial.fecha)} · mindicador.cl
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <TriangleAlertIcon className="size-4 shrink-0 text-amber-600" aria-hidden />
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="hidden sm:inline">UF no disponible, ingrésala:</span>
        <span className="sm:hidden">UF</span>
        <Input
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            const valor = parseMontoCL(e.target.value);
            setManual(valor !== null && valor > 0 ? valor : null);
          }}
          inputMode="decimal"
          placeholder="41.122,74"
          aria-label="Valor UF manual en pesos"
          className="h-8 w-28 tabular-nums"
        />
      </label>
      {manual && (
        <span className="hidden text-xs tabular-nums text-muted-foreground lg:inline">
          = {formatCLP(manual.valor)} por UF
        </span>
      )}
    </div>
  );
}
