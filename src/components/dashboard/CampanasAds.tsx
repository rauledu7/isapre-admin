"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFechaHoy } from "@/hooks/useFechaHoy";
import { sumarDias } from "@/lib/fecha";
import type { ResumenAds } from "@/lib/googleAds";

const entero = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });
const conversiones = new Intl.NumberFormat("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function dinero(valor: number, moneda: string): string {
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: moneda,
      maximumFractionDigits: moneda === "CLP" ? 0 : 2,
    }).format(valor);
  } catch {
    return `${moneda} ${entero.format(valor)}`;
  }
}

export function CampanasAds() {
  const hoy = useFechaHoy();
  const [elegido, setElegido] = useState<{ desde: string; hasta: string } | null>(null);
  const desde = elegido?.desde ?? (hoy ? sumarDias(hoy, -29) : "");
  const hasta = elegido?.hasta ?? hoy ?? "";
  const [resumen, setResumen] = useState<ResumenAds | null>(null);
  const [conectado, setConectado] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!desde || !hasta || desde > hasta) return;
    let vivo = true;
    void fetch(`/api/ads/metricas?desde=${desde}&hasta=${hasta}`)
      .then((respuesta) => respuesta.json())
      .then((json: { conectado?: boolean; resumen?: ResumenAds; error?: string }) => {
        if (!vivo) return;
        setConectado(Boolean(json.conectado));
        setResumen(json.resumen ?? null);
        setError(json.error ?? null);
      })
      .catch(() => {
        if (vivo) setError("No se pudo leer Google Ads");
      });
    return () => {
      vivo = false;
    };
  }, [desde, hasta]);

  const celdas = resumen
    ? [
        { etiqueta: "Conversiones", valor: conversiones.format(resumen.conversiones) },
        { etiqueta: "Impresiones", valor: entero.format(resumen.impresiones) },
        { etiqueta: "Costo", valor: dinero(resumen.costo, resumen.moneda) },
        { etiqueta: "Clics", valor: entero.format(resumen.clics) },
        { etiqueta: "Interacciones", valor: entero.format(resumen.interacciones) },
        { etiqueta: "CPC promedio", valor: resumen.cpc === null ? "—" : dinero(resumen.cpc, resumen.moneda) },
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Ads</CardTitle>
        <CardDescription>Cifras de la cuenta en el rango elegido. No usa los prospectos.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ads-desde">Desde</Label>
            <Input
              id="ads-desde"
              type="date"
              value={desde}
              max={hasta || undefined}
              onChange={(e) => setElegido({ desde: e.target.value, hasta })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ads-hasta">Hasta</Label>
            <Input
              id="ads-hasta"
              type="date"
              value={hasta}
              min={desde || undefined}
              max={hoy || undefined}
              onChange={(e) => setElegido({ desde, hasta: e.target.value })}
            />
          </div>
        </div>
        {desde > hasta && <p className="text-sm text-destructive">La fecha inicial es posterior a la final.</p>}
        {conectado === false && (
          <p className="text-sm text-muted-foreground">
            Conecta la cuenta en <Link href="/google-ads" className="underline">Google Ads</Link> para ver estas cifras.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {celdas.length > 0 && (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {celdas.map((celda) => (
              <div key={celda.etiqueta} className="rounded-lg border px-3 py-2">
                <dt className="text-xs text-muted-foreground">{celda.etiqueta}</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums">{celda.valor}</dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
