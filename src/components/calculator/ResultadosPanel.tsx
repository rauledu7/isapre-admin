"use client";

import { CircleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ISAPRES, TOPE_IMPONIBLE_SALUD_UF } from "@/config/isapres";
import { useCotizacion } from "@/hooks/useCotizacion";
import type { ResultadoPlanAlternativa } from "@/lib/calculators/cotizador";
import { formatCLP, formatFactor, formatUF } from "@/lib/format";
import { desglosePlan } from "@/lib/propuesta";
import { cn } from "@/lib/utils";
import { useCotizadorStore } from "@/store/cotizadorStore";
import { useUFStore } from "@/store/ufStore";
import type { IsapreId, ResultadoDiferencia } from "@/types/isapre";

const nombreIsapre = (id: IsapreId | null) => ISAPRES.find((i) => i.id === id)?.nombre;

function Monto({ uf, clp, destacado }: { uf: number; clp: number; destacado?: boolean }) {
  return (
    <div className="shrink-0 text-right whitespace-nowrap tabular-nums">
      <p className={cn("font-medium", destacado && "text-lg font-semibold")}>{formatUF(uf)}</p>
      <p className="text-xs text-muted-foreground">{formatCLP(clp)}</p>
    </div>
  );
}

function Fila({ etiqueta, detalle, children }: { etiqueta: string; detalle?: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <div>
        <p className="text-sm">{etiqueta}</p>
        {detalle && <p className="text-xs text-muted-foreground">{detalle}</p>}
      </div>
      {children}
    </div>
  );
}

function BadgeDiferencia({ diferencia }: { diferencia: ResultadoDiferencia }) {
  const config = {
    excedente: { texto: "Genera excedentes", clase: "bg-emerald-100 text-emerald-800" },
    adicional: { texto: "Requiere cotización adicional", clase: "bg-amber-100 text-amber-900" },
    sin_diferencia: { texto: "Cubierto exacto por el 7%", clase: "bg-secondary text-secondary-foreground" },
  }[diferencia.tipo];
  return <Badge className={config.clase}>{config.texto}</Badge>;
}

function FilaDiferencia({ diferencia }: { diferencia: ResultadoDiferencia }) {
  if (diferencia.tipo === "sin_diferencia") {
    return (
      <Fila etiqueta="Diferencia vs. 7% legal">
        <Monto uf={0} clp={0} />
      </Fila>
    );
  }
  const excedente = diferencia.tipo === "excedente";
  return (
    <Fila
      etiqueta={excedente ? "Excedentes mensuales" : "Cotización adicional mensual"}
      detalle={excedente ? "7% legal − precio del plan" : "Precio del plan − 7% legal"}
    >
      <Monto
        uf={excedente ? diferencia.excedenteUF : diferencia.adicionalUF}
        clp={excedente ? diferencia.excedenteCLP : diferencia.adicionalCLP}
        destacado
      />
    </Fila>
  );
}

function PlanResultadoCard({ item }: { item: ResultadoPlanAlternativa }) {
  const { plan, resultado, variacionVsActualUF, variacionVsActualCLP } = item;
  const p = resultado.plan;

  return (
    <Card>
      <CardHeader>
        <CardDescription>{nombreIsapre(plan.isapreId) ?? "Isapre sin seleccionar"}</CardDescription>
        <CardTitle>{plan.nombre}</CardTitle>
        <div>
          <BadgeDiferencia diferencia={resultado.diferencia} />
        </div>
      </CardHeader>
      <CardContent>
        {desglosePlan(item, resultado.valorUF).map((l) => (
          <Fila key={l.etiqueta} etiqueta={l.etiqueta} detalle={l.detalle}>
            <Monto uf={l.uf} clp={l.clp} />
          </Fila>
        ))}
        <Separator className="my-1.5" />
        <Fila etiqueta="Precio final del plan">
          <Monto uf={p.precioFinalUF} clp={p.precioFinalCLP} destacado />
        </Fila>
        <FilaDiferencia diferencia={resultado.diferencia} />
        {variacionVsActualUF !== null && variacionVsActualCLP !== null && (
          <Fila
            etiqueta={variacionVsActualUF <= 0 ? "Ahorro vs. plan actual" : "Mayor costo vs. plan actual"}
          >
            <Monto uf={Math.abs(variacionVsActualUF)} clp={Math.abs(variacionVsActualCLP)} />
          </Fila>
        )}
      </CardContent>
    </Card>
  );
}

function Aviso({ titulo, items }: { titulo: string; items?: string[] }) {
  return (
    <Card size="sm">
      <CardContent className="flex gap-2.5">
        <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="text-sm">
          <p className="font-medium">{titulo}</p>
          {items && items.length > 0 && (
            <ul className="mt-1 list-disc pl-4 text-muted-foreground">
              {items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ResultadosPanel() {
  const cotizacion = useCotizacion();
  const ufInicializada = useUFStore((s) => s.inicializado);
  const isapreActual = useCotizadorStore((s) => s.cliente.isapreActual);

  if (cotizacion.estado === "sin_uf") {
    return (
      <Aviso
        titulo={ufInicializada ? "Ingresa el valor UF en el encabezado para calcular" : "Obteniendo valor UF…"}
      />
    );
  }
  if (cotizacion.estado === "error") return <Aviso titulo={cotizacion.mensaje} />;
  if (cotizacion.estado === "incompleto") {
    return <Aviso titulo="Completa los datos para cotizar" items={cotizacion.faltantes} />;
  }

  const { resultado, planesIncompletos } = cotizacion;
  const legal = resultado.cotizacionLegal;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>7% legal del cliente</CardTitle>
          <CardDescription>
            Cotización obligatoria de salud sobre la renta imponible
            {legal.aplicaTope && ` (con tope de ${formatFactor(TOPE_IMPONIBLE_SALUD_UF)} UF)`}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Fila etiqueta="Renta imponible">
            <Monto uf={legal.rentaImponibleUF} clp={legal.rentaImponibleCLP} />
          </Fila>
          {legal.aplicaTope && (
            <Fila etiqueta="Renta imponible topada">
              <Monto uf={legal.rentaTopadaUF} clp={legal.rentaTopadaCLP} />
            </Fila>
          )}
          <Fila etiqueta="7% obligatorio">
            <Monto uf={legal.cotizacionLegalUF} clp={legal.cotizacionLegalCLP} destacado />
          </Fila>
          <Separator className="my-1.5" />
          <div className="flex flex-wrap gap-1.5 pt-1.5">
            {resultado.beneficiarios.map((b, i) => (
              <Badge key={i} variant="outline" className="tabular-nums">
                {b.rol === "titular" ? "Titular" : `Carga ${i}`} · {b.edad} años · {formatFactor(b.factor)}
              </Badge>
            ))}
            <Badge variant="secondary" className="tabular-nums">
              Suma factores {formatFactor(resultado.sumaFactores)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {resultado.planActual && (
        <Card>
          <CardHeader>
            <CardDescription>Situación actual</CardDescription>
            <CardTitle>
              Plan actual{isapreActual ? ` · ${nombreIsapre(isapreActual)}` : ""}
            </CardTitle>
            <div>
              <BadgeDiferencia diferencia={resultado.planActual.diferencia} />
            </div>
          </CardHeader>
          <CardContent>
            <Fila etiqueta="Precio plan actual">
              <Monto uf={resultado.planActual.precioUF} clp={resultado.planActual.precioCLP} destacado />
            </Fila>
            <FilaDiferencia diferencia={resultado.planActual.diferencia} />
          </CardContent>
        </Card>
      )}

      {planesIncompletos.length > 0 && <Aviso titulo="Planes incompletos" items={planesIncompletos} />}
      {resultado.planes.length === 0 && planesIncompletos.length === 0 && (
        <Aviso titulo="Ingresa el precio base de al menos un plan" />
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,19rem),1fr))] gap-4">
        {resultado.planes.map((item) => (
          <PlanResultadoCard key={item.plan.id} item={item} />
        ))}
      </div>
    </div>
  );
}
