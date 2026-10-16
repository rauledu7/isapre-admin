"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PLANES_PUBLICOS, precioPublico } from "@/config/planesPublicos";
import { formatCLP } from "@/lib/format";
import { PERIODOS, descuentoPeriodo, type PeriodoPago } from "@/lib/suscripcion";
import { cn } from "@/lib/utils";

const SUFIJO: Record<PeriodoPago, string> = {
  mensual: "al mes",
  trimestral: "el trimestre",
  anual: "el año",
};

export function PlanesLanding({ display }: { display: string }) {
  const [periodo, setPeriodo] = useState<PeriodoPago>("mensual");

  return (
    <div className="flex flex-col gap-8">
      <div
        role="radiogroup"
        aria-label="Período de pago"
        className="grid w-full grid-cols-3 rounded-full bg-white p-1 ring-1 ring-[#1c1917]/10 sm:w-fit"
      >
        {PERIODOS.map((item) => {
          const activo = periodo === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => setPeriodo(item.id)}
              className={cn(
                "rounded-full px-3 py-2 text-sm transition",
                activo ? "bg-[#14161c] text-white" : "text-[#1c1917]/70 hover:text-[#1c1917]",
              )}
            >
              {item.nombre}
            </button>
          );
        })}
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        {PLANES_PUBLICOS.map((plan) => {
          const descuento = descuentoPeriodo(
            { mensual: plan.mensual, trimestral: plan.trimestral, anual: plan.anual },
            periodo,
          );
          return (
            <article
              key={plan.nivel}
              className={cn(
                "flex flex-col gap-5 rounded-3xl p-6 transition duration-300 hover:-translate-y-1 motion-reduce:transform-none",
                plan.destacado ? "bg-[#14161c] text-white" : "bg-white ring-1 ring-[#1c1917]/10 hover:bg-white",
              )}
            >
              <div className="flex flex-col gap-1">
                <p className={cn("text-xs font-medium tracking-wide", plan.destacado ? "text-white/70" : "text-[#3730a3]")}>
                  {plan.linea}
                </p>
                <h3 className={cn(display, "text-3xl font-medium")}>{plan.nombre}</h3>
              </div>
              <div className="flex flex-col gap-1">
                <p className="flex items-end gap-1">
                  <span className="text-3xl font-medium tabular-nums">{formatCLP(precioPublico(plan, periodo))}</span>
                  <span className={cn("pb-1 text-sm", plan.destacado ? "text-white/60" : "text-[#1c1917]/55")}>
                    {SUFIJO[periodo]}
                  </span>
                </p>
                {descuento !== null && (
                  <p className={cn("text-sm", plan.destacado ? "text-white/60" : "text-[#1c1917]/55")}>
                    {descuento}% menos que mes a mes
                  </p>
                )}
              </div>
              <ul className="flex flex-col gap-2 text-sm leading-relaxed">
                {plan.incluye.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="mt-auto pt-2">
                <Button
                  variant="outline"
                  className={cn(
                    "h-11 bg-transparent px-5 text-base",
                    plan.destacado
                      ? "border-white/40 text-white hover:bg-white/10 hover:text-white"
                      : "border-[#1c1917]/25 text-[#1c1917] hover:bg-[#1c1917]/5",
                  )}
                  nativeButton={false}
                  render={<a href={`/registro?plan=${plan.slug}&periodo=${periodo}`} />}
                >
                  {`Empezar con ${plan.nombre}`}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
