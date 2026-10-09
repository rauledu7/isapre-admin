"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { conMetricas, costoPorLead, resumenCampanas, type MetricaGoogle } from "@/lib/adquisicion";
import { formatUF } from "@/lib/format";
import type { EtapaEmbudo, Prospecto } from "@/types/isapre";

const numero = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });
const dinero = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 });

function celda(valor: number | null): string {
  return valor === null ? "—" : numero.format(valor);
}

export function CampanasAds({ etapas, prospectos }: { etapas: EtapaEmbudo[]; prospectos: Prospecto[] }) {
  const [google, setGoogle] = useState<MetricaGoogle[] | null>(null);

  useEffect(() => {
    let vivo = true;
    void fetch("/api/ads/metricas")
      .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
      .then((json: { conectado?: boolean; metricas?: MetricaGoogle[] } | null) => {
        if (!vivo || !json?.conectado) return;
        setGoogle(json.metricas ?? []);
      })
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, []);

  const filas = conMetricas(resumenCampanas(prospectos, etapas), google);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campañas</CardTitle>
        <CardDescription>
          Leads y UF cerradas por campaña. Clics y gasto salen de Google Ads del mes en curso; sin la cuenta
          conectada quedan en —.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay prospectos para agrupar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Campaña</th>
                  <th className="py-2 pr-3 text-right font-medium">Clics</th>
                  <th className="py-2 pr-3 text-right font-medium">Leads</th>
                  <th className="py-2 pr-3 text-right font-medium">Gasto</th>
                  <th className="py-2 pr-3 text-right font-medium">Costo por lead</th>
                  <th className="py-2 pr-3 text-right font-medium">Cierres</th>
                  <th className="py-2 text-right font-medium">UF cerradas</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((fila) => {
                  const costo = costoPorLead(fila.gasto, fila.leads);
                  return (
                    <tr key={fila.campana} className="border-b last:border-0">
                      <td className="py-2 pr-3">{fila.campana}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{celda(fila.clics)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{numero.format(fila.leads)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {fila.gasto === null ? "—" : dinero.format(fila.gasto)}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {costo === null ? "—" : dinero.format(costo)}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">{numero.format(fila.cierres)}</td>
                      <td className="py-2 text-right tabular-nums">{formatUF(fila.ufCerradas)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
