"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useFechaHoy } from "@/hooks/useFechaHoy";
import { useProspectos } from "@/hooks/useProspectos";
import { estaVencido, grillaMes, seguimientosDelDia } from "@/lib/calendario";
import { cn } from "@/lib/utils";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function CalendarioView() {
  const hoy = useFechaHoy();
  const [cursor, setCursor] = useState<string | null>(null);
  const visible = cursor ?? hoy;
  const anio = Number(visible?.slice(0, 4) ?? "2026");
  const mes = Number(visible?.slice(5, 7) ?? "1");
  const { estado, error, prospectos, recargar } = useProspectos();

  function mover(delta: number) {
    const fecha = new Date(Date.UTC(anio, mes - 1 + delta, 1));
    const siguienteMes = String(fecha.getUTCMonth() + 1).padStart(2, "0");
    setCursor(`${fecha.getUTCFullYear()}-${siguienteMes}-01`);
  }

  const titulo = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(anio, mes - 1, 1)),
  );

  if (!hoy || estado === "inicial" || estado === "cargando") {
    return <p className="text-sm text-muted-foreground">Cargando calendario…</p>;
  }
  if (estado === "error") {
    return (
      <p className="text-sm text-destructive">
        {error}{" "}
        <button type="button" className="underline" onClick={() => void recargar()}>
          Reintentar
        </button>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" aria-label="Mes anterior" onClick={() => mover(-1)}>
          <ChevronLeftIcon />
        </Button>
        <h2 className="text-base font-semibold">{titulo.charAt(0).toUpperCase() + titulo.slice(1)}</h2>
        <Button variant="outline" size="icon" aria-label="Mes siguiente" onClick={() => mover(1)}>
          <ChevronRightIcon />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {DIAS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {grillaMes(anio, mes)
          .flat()
          .map((dia) => {
            const citas = seguimientosDelDia(prospectos, dia.fecha);
            const vencido = estaVencido(dia.fecha, hoy);
            return (
              <div
                key={dia.fecha}
                className={cn(
                  "flex min-h-20 flex-col gap-1 rounded-lg p-1.5 text-xs ring-1 ring-foreground/10",
                  dia.enMes ? "bg-card" : "bg-muted/40 text-muted-foreground",
                  dia.fecha === hoy && "ring-proceso",
                )}
              >
                <span className={cn("font-medium tabular-nums", vencido && citas.length > 0 && "text-alerta")}>
                  {Number(dia.fecha.slice(8))}
                </span>
                {citas.slice(0, 2).map((p) => (
                  <Link key={p.id} href={`/prospectos/${p.id}`} className="truncate rounded bg-proceso/10 px-1 py-0.5 text-foreground hover:underline">
                    {p.nombre}
                  </Link>
                ))}
                {citas.length > 2 && <span className="text-muted-foreground">+{citas.length - 2}</span>}
              </div>
            );
          })}
      </div>
    </div>
  );
}
