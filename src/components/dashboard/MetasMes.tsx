"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFechaHoy } from "@/hooks/useFechaHoy";
import { estaVencido, seguimientosOrdenados } from "@/lib/calendario";
import { formatFecha } from "@/lib/fecha";
import { formatUF } from "@/lib/format";
import { avanceMes, porcentajeMeta } from "@/lib/metas";
import { cn } from "@/lib/utils";
import { usePerfilStore } from "@/store/perfilStore";
import type { EtapaEmbudo, Prospecto } from "@/types/isapre";

function Barra({
  actual,
  meta,
  texto,
}: {
  actual: number;
  meta: number | null;
  texto: (valor: number) => string;
}) {
  const porcentaje = porcentajeMeta(actual, meta);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium tabular-nums">{texto(actual)}</span>
        <span className="text-muted-foreground">{meta === null ? "Sin meta" : `de ${texto(meta)}`}</span>
      </div>
      {porcentaje !== null && (
        <div className="h-2 overflow-hidden rounded-full bg-muted" role="meter" aria-valuenow={Math.round(porcentaje)} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={cn("h-full rounded-full", porcentaje >= 100 ? "bg-exito" : "bg-proceso")}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function MetasMes({ etapas, prospectos }: { etapas: EtapaEmbudo[]; prospectos: Prospecto[] }) {
  const perfil = usePerfilStore((s) => s.perfil);
  const cargar = usePerfilStore((s) => s.cargar);
  useEffect(() => {
    void cargar();
  }, [cargar]);

  const hoy = useFechaHoy();
  const avance = avanceMes(prospectos, etapas, (hoy ?? "0000-00").slice(0, 7));
  const proximos = seguimientosOrdenados(prospectos).slice(0, 5);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Meta de {hoy ? nombreMes(hoy) : "este mes"}</CardTitle>
          <CardDescription>
            UF del plan afiliado y contratos que cerraste este mes. Se configuran en Mis datos.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">UF cerradas</p>
            <Barra actual={avance.uf} meta={perfil?.metaUfMes ?? null} texto={formatUF} />
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Contratos</p>
            <Barra
              actual={avance.contratos}
              meta={perfil?.metaContratosMes ?? null}
              texto={(n) => String(n)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próximos contactos</CardTitle>
          <CardDescription>
            <Link href="/calendario" className="underline">
              Ver calendario
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {proximos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay seguimientos. Agrega un próximo contacto en la ficha del prospecto.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {proximos.map((p) => (
                <li key={p.id}>
                  <Link href={`/prospectos/${p.id}`} className="flex items-baseline justify-between gap-3 text-sm hover:underline">
                    <span className="truncate">{p.nombre}</span>
                    <span className={cn("shrink-0 tabular-nums", hoy && estaVencido(p.proximoContacto ?? "", hoy) ? "text-alerta" : "text-muted-foreground")}>
                      {formatFecha(p.proximoContacto ?? "")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function nombreMes(iso: string): string {
  const [anio, mes] = iso.split("-").map(Number) as [number, number];
  const texto = new Intl.DateTimeFormat("es-CL", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(anio, mes - 1, 1)),
  );
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
