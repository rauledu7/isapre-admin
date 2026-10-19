"use client";

import { SearchIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  categoriaAsesor,
  filtrarAsesores,
  metricasAdmin,
  NOMBRE_CATEGORIA,
  type AsesorAdmin,
  type CategoriaAsesor,
  type PagoAdmin,
} from "@/lib/adminAsesores";
import { fechaISO, formatFecha } from "@/lib/fecha";
import { formatCLP } from "@/lib/format";
import type { PlanPago } from "@/lib/suscripcion";

import { TarifariosAdmin } from "./TarifariosAdmin";

interface Datos {
  asesores: AsesorAdmin[];
  pagos: PagoAdmin[];
  planes: PlanPago[];
}

type Accion = "extender_trial" | "activar" | "cambiar_plan" | "bloquear" | "desbloquear";

const VARIANTE: Partial<Record<CategoriaAsesor, "secondary" | "destructive" | "outline">> = {
  pagado: "secondary",
  pendiente: "destructive",
  vencido: "destructive",
  bloqueado: "destructive",
};

const SIN_PLAN = "sin_plan";

async function pedirDatos(): Promise<Datos> {
  const respuesta = await fetch("/api/admin/asesores");
  const cuerpo = (await respuesta.json()) as Datos & { error?: string };
  if (!respuesta.ok) throw new Error(cuerpo.error ?? "No se pudieron cargar los datos.");
  return cuerpo;
}

const mensaje = (err: unknown) => (err instanceof Error ? err.message : "No se pudieron cargar los datos.");

function fechaChile(iso: string | null): string {
  return iso ? formatFecha(fechaISO(new Date(iso))) : "—";
}

function Metrica({ titulo, valor, detalle }: { titulo: string; valor: string; detalle?: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
        <CardTitle className="text-xl tabular-nums">{valor}</CardTitle>
        {detalle && <p className="text-xs text-muted-foreground">{detalle}</p>}
      </CardHeader>
    </Card>
  );
}

function AccionesDialog({
  asesor,
  planes,
  onClose,
  onHecho,
}: {
  asesor: AsesorAdmin;
  planes: PlanPago[];
  onClose: () => void;
  onHecho: () => void;
}) {
  const s = asesor.suscripcion;
  const [planId, setPlanId] = useState<string>(s?.planId ?? SIN_PLAN);
  const [ocupado, setOcupado] = useState<Accion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const items = [{ value: SIN_PLAN, label: "Sin plan (acceso completo, sin cobro)" }, ...planes.map((p) => ({ value: p.id, label: p.nombre }))];

  async function ejecutar(accion: Accion) {
    setOcupado(accion);
    setError(null);
    try {
      const respuesta = await fetch(`/api/admin/asesores/${asesor.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, planId: planId === SIN_PLAN ? null : planId }),
      });
      const cuerpo = (await respuesta.json()) as { error?: string };
      if (!respuesta.ok) {
        setError(cuerpo.error ?? "No se pudo guardar.");
        return;
      }
      onHecho();
    } catch {
      setError("No se pudo guardar.");
    } finally {
      setOcupado(null);
    }
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{asesor.nombre ?? asesor.email ?? "Asesor"}</DialogTitle>
          <DialogDescription>
            {asesor.email} · {NOMBRE_CATEGORIA[categoriaAsesor(s, new Date())]}
            {asesor.planNombre && ` · Plan ${asesor.planNombre}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Button variant="outline" disabled={ocupado !== null} onClick={() => void ejecutar("extender_trial")}>
              {ocupado === "extender_trial" ? "Guardando…" : "Extender prueba 7 días"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Prueba hasta hoy: {fechaChile(s?.fechaFinTrial ?? null)}. Suma 7 días desde ese fin o desde hoy.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-admin">Plan</Label>
            <Select items={items} value={planId} onValueChange={(v) => v && setPlanId(v as string)}>
              <SelectTrigger id="plan-admin" className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {items.map((i) => (
                  <SelectItem key={i.value} value={i.value}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              <Button disabled={ocupado !== null} onClick={() => void ejecutar("activar")}>
                {ocupado === "activar" ? "Guardando…" : "Activar manualmente"}
              </Button>
              <Button
                variant="outline"
                disabled={ocupado !== null || planId === SIN_PLAN || planId === s?.planId}
                onClick={() => void ejecutar("cambiar_plan")}
              >
                {ocupado === "cambiar_plan" ? "Guardando…" : "Cambiar plan"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Activar deja la suscripción activa sin vencimiento. Ninguna de las dos cambia lo que cobra Mercado Pago.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          {s?.bloqueado ? (
            <Button variant="outline" disabled={ocupado !== null} onClick={() => void ejecutar("desbloquear")}>
              {ocupado === "desbloquear" ? "Guardando…" : "Desbloquear"}
            </Button>
          ) : (
            <Button variant="destructive" disabled={ocupado !== null} onClick={() => void ejecutar("bloquear")}>
              {ocupado === "bloquear" ? "Guardando…" : "Bloquear usuario"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminPanel() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [elegidoId, setElegidoId] = useState<string | null>(null);

  function recargar() {
    void pedirDatos()
      .then((nuevos) => {
        setDatos(nuevos);
        setError(null);
      })
      .catch((err: unknown) => setError(mensaje(err)));
  }

  useEffect(() => {
    let vigente = true;
    void pedirDatos()
      .then((nuevos) => vigente && setDatos(nuevos))
      .catch((err: unknown) => vigente && setError(mensaje(err)));
    return () => {
      vigente = false;
    };
  }, []);

  const filtrados = useMemo(() => (datos ? filtrarAsesores(datos.asesores, busqueda) : []), [datos, busqueda]);
  const elegido = datos?.asesores.find((a) => a.id === elegidoId) ?? null;

  if (error && !datos) return <p className="text-sm text-destructive">{error}</p>;
  if (!datos) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  const ahora = new Date();
  const metricas = metricasAdmin(datos.asesores, datos.pagos, ahora);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metrica titulo="Ingresos del mes" valor={formatCLP(metricas.ingresosMesCLP)} detalle="Pagos aprobados en Mercado Pago" />
        <Metrica titulo="Ingresos totales" valor={formatCLP(metricas.ingresosTotalCLP)} />
        <Metrica titulo="En prueba" valor={String(metricas.enTrial)} detalle={`de ${metricas.total} asesores`} />
        <Metrica
          titulo="Pagados"
          valor={String(metricas.pagados)}
          detalle={`${metricas.cortesia} sin cobro · ${metricas.pendientes} con pago pendiente · ${metricas.bloqueados} bloqueados`}
        />
      </div>

      <TarifariosAdmin />

      <section className="flex flex-col gap-3">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por email o nombre"
            aria-label="Buscar asesor"
            className="pl-8"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Asesor</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium">Plan</th>
                <th className="px-3 py-2 font-medium">Fin prueba</th>
                <th className="px-3 py-2 font-medium">Próximo pago</th>
                <th className="px-3 py-2 font-medium">Último ingreso</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtrados.map((a) => {
                const categoria = categoriaAsesor(a.suscripcion, ahora);
                return (
                  <tr key={a.id} className="border-t">
                    <td className="px-3 py-2">
                      <p className="font-medium">{a.nombre ?? "Sin nombre"}</p>
                      <p className="text-xs text-muted-foreground">{a.email ?? "—"}</p>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={VARIANTE[categoria] ?? "outline"}>{NOMBRE_CATEGORIA[categoria]}</Badge>
                    </td>
                    <td className="px-3 py-2">{a.planNombre ?? "—"}</td>
                    <td className="px-3 py-2 tabular-nums">{fechaChile(a.suscripcion?.fechaFinTrial ?? null)}</td>
                    <td className="px-3 py-2 tabular-nums">{fechaChile(a.suscripcion?.fechaProximoPago ?? null)}</td>
                    <td className="px-3 py-2 tabular-nums">{fechaChile(a.ultimoIngreso)}</td>
                    <td className="px-3 py-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => setElegidoId(a.id)}>
                        Acciones
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                    Ningún asesor coincide con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {elegido && (
        <AccionesDialog
          asesor={elegido}
          planes={datos.planes}
          onClose={() => setElegidoId(null)}
          onHecho={() => {
            setElegidoId(null);
            recargar();
          }}
        />
      )}
    </div>
  );
}
