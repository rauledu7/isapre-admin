"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";
import { fechaISO, formatFecha } from "@/lib/fecha";
import { formatCLP } from "@/lib/format";
import { ESTADO_PAGO } from "@/lib/mercadoPago";
import { getSupabase } from "@/lib/supabase/client";
import { listarPagos, type PagoRegistrado } from "@/lib/supabase/suscripciones";
import { PERIODOS } from "@/lib/suscripcion";

const ESTADO_SUSCRIPCION = {
  trialing: "Prueba gratis",
  active: "Activa",
  past_due: "Pago pendiente",
  canceled: "Cancelada",
} as const;

function fechaChile(iso: string): string {
  return formatFecha(fechaISO(new Date(iso)));
}

export function FacturacionPanel() {
  const estado = useSubscription();
  const [pagos, setPagos] = useState<PagoRegistrado[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    void listarPagos(getSupabase())
      .then((lista) => vigente && setPagos(lista))
      .catch((err: unknown) => vigente && setError(err instanceof Error ? err.message : "No se pudo cargar el historial."));
    return () => {
      vigente = false;
    };
  }, []);

  const suscripcion = !estado.cargando && estado.error === null ? estado.suscripcion : null;
  const plan = !estado.cargando && estado.error === null ? estado.planes.find((p) => p.id === suscripcion?.planId) : undefined;
  const periodo = PERIODOS.find((p) => p.id === suscripcion?.periodo);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {plan ? `Plan ${plan.nombre}` : "Sin plan contratado"}
            {suscripcion && <Badge variant="outline">{ESTADO_SUSCRIPCION[suscripcion.estado]}</Badge>}
          </CardTitle>
          <CardDescription>
            {periodo && `Pago ${periodo.nombre.toLowerCase()}. `}
            {suscripcion?.fechaProximoPago
              ? `${suscripcion.estado === "canceled" ? "Acceso hasta el" : "Próximo cobro el"} ${fechaChile(suscripcion.fechaProximoPago)}.`
              : "Sin cobros programados."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/suscripcion" className="text-sm text-primary underline-offset-4 hover:underline">
            Cambiar de plan
          </Link>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Historial de pagos</h2>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!error && pagos === null && <p className="text-sm text-muted-foreground">Cargando…</p>}
        {pagos?.length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay pagos procesados.</p>}
        {pagos && pagos.length > 0 && (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Fecha</th>
                  <th className="px-3 py-2 font-medium">Detalle</th>
                  <th className="px-3 py-2 text-right font-medium">Monto</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id} className="border-t">
                    <td className="px-3 py-2 tabular-nums">{fechaChile(pago.fecha)}</td>
                    <td className="px-3 py-2">{pago.detalle ?? "Suscripción Velora"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {pago.montoCLP === null ? "—" : formatCLP(pago.montoCLP)}
                    </td>
                    <td className="px-3 py-2">{ESTADO_PAGO[pago.estado] ?? pago.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Los pagos los procesa Mercado Pago. El comprobante te llega a tu correo.</p>
      </section>
    </div>
  );
}
