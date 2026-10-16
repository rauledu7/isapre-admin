"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";
import { fechaISO, formatFecha } from "@/lib/fecha";
import { formatCLP } from "@/lib/format";
import {
  descuentoPeriodo,
  funcionesDe,
  inicioCobro,
  NOMBRE_FUNCION,
  PERIODOS,
  type NivelPlan,
  type PeriodoPago,
  type Suscripcion,
} from "@/lib/suscripcion";
import { cn } from "@/lib/utils";

function fechaChile(iso: string): string {
  return formatFecha(fechaISO(new Date(iso)));
}

const sinCambios = () => () => {};

function incluye(nivel: NivelPlan | null): string {
  const extras = nivel ? funcionesDe(nivel).map((f) => NOMBRE_FUNCION[f]) : [];
  return ["Dashboard, calendario, cotizador y prospectos", ...extras].join(" · ");
}

function resumen(s: Suscripcion | null, vigente: boolean, diasTrial: number | null): { titulo: string; detalle: string } {
  if (!s) return { titulo: "Sin suscripción", detalle: "Elige un plan para seguir usando Velora." };
  switch (s.estado) {
    case "trialing":
      return vigente
        ? {
            titulo: "Prueba gratis",
            detalle: `Te ${diasTrial === 1 ? "queda 1 día" : `quedan ${diasTrial} días`}. Vence el ${fechaChile(s.fechaFinTrial!)}.`,
          }
        : { titulo: "Prueba terminada", detalle: "Tu prueba de 7 días terminó. Elige un plan para seguir usando Velora." };
    case "active":
      return {
        titulo: "Suscripción activa",
        detalle: s.fechaProximoPago ? `Próximo pago el ${fechaChile(s.fechaProximoPago)}.` : "Tienes acceso completo.",
      };
    case "past_due":
      return { titulo: "Pago pendiente", detalle: "No pudimos cobrar tu último pago. Actualiza tu medio de pago para seguir." };
    case "canceled":
      return vigente
        ? { titulo: "Suscripción cancelada", detalle: `Tienes acceso hasta el ${fechaChile(s.fechaProximoPago!)}.` }
        : { titulo: "Suscripción cancelada", detalle: "Elige un plan para volver a usar Velora." };
  }
}

export function SuscripcionPanel() {
  const estado = useSubscription();
  const [eleccion, setEleccion] = useState<{ planId: string; periodo: PeriodoPago } | null>(null);
  const [pagando, setPagando] = useState(false);
  const [errorPago, setErrorPago] = useState<string | null>(null);
  const retorno = useSyncExternalStore(
    sinCambios,
    () => new URLSearchParams(window.location.search).get("pago") === "retorno",
    () => false,
  );

  async function pagar() {
    if (!eleccion) return;
    setPagando(true);
    setErrorPago(null);
    try {
      const respuesta = await fetch("/api/v1/checkout/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eleccion),
      });
      const cuerpo = (await respuesta.json()) as { url?: string; error?: string };
      if (!respuesta.ok || !cuerpo.url) {
        setErrorPago(cuerpo.error ?? "No se pudo iniciar el pago.");
        setPagando(false);
        return;
      }
      window.location.assign(cuerpo.url);
    } catch {
      setErrorPago("No se pudo iniciar el pago.");
      setPagando(false);
    }
  }

  if (estado.cargando) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (estado.error !== null) return <p className="text-sm text-destructive">{estado.error}</p>;

  const { suscripcion, planes, vigente, diasTrial } = estado;
  const { titulo, detalle } = resumen(suscripcion, vigente, diasTrial);
  const primerCobro = inicioCobro(suscripcion, new Date());

  return (
    <div className="flex flex-col gap-6">
      {retorno && (
        <p role="status" className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          Estamos confirmando tu pago con Mercado Pago. Puede tardar unos minutos: recarga esta página para ver el estado.
        </p>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {titulo}
            <Badge variant={vigente ? "secondary" : "destructive"}>{vigente ? "Con acceso" : "Sin acceso"}</Badge>
          </CardTitle>
          <CardDescription>{detalle}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/cuenta/facturacion" className="text-sm text-primary underline-offset-4 hover:underline">
            Ver facturación e historial de pagos
          </Link>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Planes</h2>
        {planes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Los precios se publicarán pronto.</p>
        ) : (
          planes.map((plan) => (
            <Card key={plan.id} size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {plan.nombre}
                  {suscripcion?.planId === plan.id && <Badge variant="outline">Tu plan</Badge>}
                </CardTitle>
                <CardDescription>{incluye(plan.nivel)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div role="radiogroup" aria-label={`Período de ${plan.nombre}`} className="grid gap-2 sm:grid-cols-3">
                  {PERIODOS.map((periodo) => {
                    const precio = plan.precios[periodo.id];
                    const descuento = descuentoPeriodo(plan.precios, periodo.id);
                    const elegido = eleccion?.planId === plan.id && eleccion.periodo === periodo.id;
                    return (
                      <button
                        key={periodo.id}
                        type="button"
                        role="radio"
                        aria-checked={elegido}
                        disabled={precio === null}
                        onClick={() => setEleccion({ planId: plan.id, periodo: periodo.id })}
                        className={cn(
                          "flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                          elegido ? "border-primary bg-primary/5" : "hover:bg-muted/60",
                        )}
                      >
                        <span className="text-sm font-medium">{periodo.nombre}</span>
                        <span className="text-sm text-muted-foreground">
                          {precio === null ? "No disponible" : formatCLP(precio)}
                        </span>
                        {descuento !== null && (
                          <span className="text-xs font-medium text-primary">Ahorras {descuento}%</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
        {planes.length > 0 && (
          <div className="flex flex-col items-start gap-1">
            <Button disabled={!eleccion || pagando} onClick={() => void pagar()}>
              {pagando ? "Abriendo Mercado Pago…" : "Pagar con Mercado Pago"}
            </Button>
            <p className="text-xs text-muted-foreground">
              {primerCobro
                ? `El primer cobro será el ${fechaChile(primerCobro)}, cuando termine lo que ya tienes. Luego se renueva solo.`
                : "Se cobra hoy y se renueva solo. Tarjeta de crédito, débito o dinero en Mercado Pago."}
              {suscripcion?.planId && " Al contratar otro plan, el anterior se cancela."}
            </p>
            {errorPago && <p className="text-xs text-destructive">{errorPago}</p>}
          </div>
        )}
      </section>
    </div>
  );
}
