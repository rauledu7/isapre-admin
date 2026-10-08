"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ISAPRES } from "@/config/isapres";
import { formatCLP, formatFechaHora, formatUF, formatValorUF } from "@/lib/format";
import { getSupabase } from "@/lib/supabase/client";
import { listarCotizaciones } from "@/lib/supabase/prospectos";
import type { Cotizacion, ResultadoDiferencia } from "@/types/isapre";

function textoDiferencia(d: ResultadoDiferencia): string {
  if (d.tipo === "excedente") return `Excedente ${formatUF(d.excedenteUF)} (${formatCLP(d.excedenteCLP)})`;
  if (d.tipo === "adicional") return `Adicional ${formatUF(d.adicionalUF)} (${formatCLP(d.adicionalCLP)})`;
  return "Sin diferencia";
}

export function HistorialCotizaciones({ prospectoId }: { prospectoId: string }) {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    listarCotizaciones(getSupabase(), prospectoId)
      .then((c) => vigente && setCotizaciones(c))
      .catch((e: Error) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [prospectoId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cotizaciones</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {cotizaciones === null && !error && <p className="text-sm text-muted-foreground">Cargando…</p>}
        {cotizaciones?.length === 0 && (
          <p className="text-sm text-muted-foreground">Sin cotizaciones. Usa “Cotizar” para crear una.</p>
        )}
        {cotizaciones?.map((c) => {
          const legal = c.resultado.cotizacionLegal;
          return (
            <article key={c.id} className="flex flex-col gap-2 rounded-lg p-3 ring-1 ring-foreground/10">
              <header className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium">{formatFechaHora(c.creadaEn)}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  UF {formatValorUF(c.valorUF.valor)} (
                  {c.valorUF.fuente === "manual" ? "manual" : c.valorUF.fecha})
                </p>
              </header>
              <p className="text-sm tabular-nums">
                7% legal: <strong>{formatUF(legal.cotizacionLegalUF)}</strong>{" "}
                <span className="text-muted-foreground">({formatCLP(legal.cotizacionLegalCLP)})</span>
              </p>
              <ul className="flex flex-col gap-1.5">
                {c.resultado.planes.map(({ plan, resultado }) => (
                  <li key={plan.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>
                      {plan.nombre}
                      <span className="text-muted-foreground">
                        {" · "}
                        {ISAPRES.find((i) => i.id === plan.isapreId)?.nombre ?? "Sin Isapre"}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 tabular-nums">
                      {formatUF(resultado.plan.precioFinalUF)}
                      <Badge variant="outline">{textoDiferencia(resultado.diferencia)}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </CardContent>
    </Card>
  );
}
