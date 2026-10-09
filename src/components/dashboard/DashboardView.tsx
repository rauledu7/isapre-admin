"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";

import { CampanasAds } from "./CampanasAds";
import { MetasMes } from "./MetasMes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { COLOR_TIPO_ETAPA, PALETA } from "@/config/ui";
import { useProspectos } from "@/hooks/useProspectos";
import { contarPorEtapa, totalesEmbudo, type TotalesEmbudo } from "@/lib/embudo";

function EtiquetaEtapa({ x, y, nombre = "" }: { x: number; y: number; nombre?: string }) {
  const visible = nombre.length > 18 ? `${nombre.slice(0, 17)}…` : nombre;
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fill="var(--foreground)" fontSize={12}>
      <title>{nombre}</title>
      {visible}
    </text>
  );
}

const METRICAS: { clave: keyof TotalesEmbudo; etiqueta: string; color: string }[] = [
  { clave: "abiertos", etiqueta: "En proceso", color: PALETA.proceso },
  { clave: "cerrados", etiqueta: "Cerrados", color: PALETA.exito },
  { clave: "perdidos", etiqueta: "Perdidos", color: PALETA.alerta },
  { clave: "total", etiqueta: "Total", color: PALETA.prioridad },
];

export function DashboardView() {
  const { estado, error, etapas, prospectos, recargar } = useProspectos();

  if (estado === "inicial" || estado === "cargando") {
    return <p className="text-sm text-muted-foreground">Cargando embudo…</p>;
  }
  if (estado === "error") {
    return (
      <Card size="sm">
        <CardContent className="flex items-center justify-between gap-4 text-sm">
          <span className="text-destructive">{error}</span>
          <Button variant="outline" size="sm" onClick={() => void recargar()}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const conteo = contarPorEtapa(etapas, prospectos);
  const totales = totalesEmbudo(conteo);

  return (
    <div className="flex flex-col gap-4">
      <MetasMes etapas={etapas} prospectos={prospectos} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {METRICAS.map((m) => (
          <Card key={m.clave} size="sm">
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: m.color }} />
                {m.etiqueta}
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">{totales[m.clave]}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Embudo</CardTitle>
          <CardDescription>Prospectos por etapa. Azul en proceso, verde cerrado, rojo perdido.</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ height: Math.max(240, conteo.length * 36) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conteo} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  width={140}
                  interval={0}
                  tick={(props) => (
                    <EtiquetaEtapa
                      x={Number(props.x)}
                      y={Number(props.y)}
                      nombre={props.payload?.value == null ? "" : String(props.payload.value)}
                    />
                  )}
                />
                <Tooltip
                  formatter={(valor) => [valor, "Prospectos"]}
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="cantidad" radius={4} maxBarSize={18}>
                  {conteo.map((c) => (
                    <Cell key={c.etapaId} fill={COLOR_TIPO_ETAPA[c.tipo]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <CampanasAds etapas={etapas} prospectos={prospectos} />
    </div>
  );
}
