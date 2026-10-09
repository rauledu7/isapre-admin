"use client";

import { FileUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GES_UF } from "@/config/isapres";
import { useGesIsapres } from "@/hooks/useGesIsapres";
import { formatUF } from "@/lib/format";
import type { PlanPdf } from "@/lib/planPdf";
import { getSupabase } from "@/lib/supabase/client";
import { listarTarifarios, type TarifarioGuardado } from "@/lib/supabase/tarifarios";
import { MAX_PLANES, useCotizadorStore } from "@/store/cotizadorStore";
import type { PlanForm } from "@/types/cotizador";
import type { IsapreId } from "@/types/isapre";

import { Campo } from "./Campo";
import { IsapreSelect } from "./IsapreSelect";
import { TarifarioPlan } from "./TarifarioPlan";

function textoUF(valor: number): string {
  return valor.toLocaleString("es-CL", { maximumFractionDigits: 4, useGrouping: false });
}

function cambiosDesdePdf(plan: PlanPdf): Partial<Omit<PlanForm, "id">> {
  const cambios: Partial<Omit<PlanForm, "id">> = {};
  if (plan.nombre && plan.codigo && !plan.nombre.includes(plan.codigo)) {
    cambios.nombre = `${plan.nombre} (${plan.codigo})`;
  } else if (plan.nombre || plan.codigo) {
    cambios.nombre = plan.nombre ?? plan.codigo ?? "";
  }
  if (plan.isapreId) cambios.isapreId = plan.isapreId;
  if (plan.precioBaseUF !== null) cambios.precioBaseUF = textoUF(plan.precioBaseUF);
  return cambios;
}

function avisoPdf(plan: PlanPdf): string {
  if (plan.precioBaseUF === null && plan.isapreId) {
    return "Quedaron el nombre y la Isapre, y el GES se marcó solo. El precio base hay que escribirlo: este PDF deja esa casilla vacía.";
  }
  if (!plan.isapreId) {
    return "Quedó el nombre. Elige la Isapre para marcar el GES.";
  }
  return "Quedaron el nombre, la Isapre, el GES y el precio base.";
}

function GesBloqueado({
  plan,
  ges,
}: {
  plan: PlanForm;
  ges: Partial<Record<IsapreId, number>>;
}) {
  const valor = plan.isapreId ? (ges[plan.isapreId] ?? GES_UF[plan.isapreId]) : null;

  return (
    <div className="flex flex-col gap-1.5">
      <Label>GES</Label>
      <p className="flex h-8 items-center rounded-lg border bg-muted/40 px-2.5 text-sm tabular-nums">
        {valor === null ? "—" : formatUF(valor)}
      </p>
      <p className="text-xs text-muted-foreground">Por beneficiario. Se cambia en Isapres.</p>
    </div>
  );
}

function PlanEditor({
  plan,
  indice,
  eliminable,
  tarifario,
  ges,
}: {
  plan: PlanForm;
  indice: number;
  eliminable: boolean;
  tarifario: TarifarioGuardado | null;
  ges: Partial<Record<IsapreId, number>>;
}) {
  const actualizarPlan = useCotizadorStore((s) => s.actualizarPlan);
  const eliminarPlan = useCotizadorStore((s) => s.eliminarPlan);
  const archivoRef = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [errorPdf, setErrorPdf] = useState<string | null>(null);
  const set = (cambios: Partial<Omit<PlanForm, "id">>) => actualizarPlan(plan.id, cambios);

  async function cargarPdf(archivo: File) {
    setCargando(true);
    setAviso(null);
    setErrorPdf(null);
    const datos = new FormData();
    datos.set("archivo", archivo);
    try {
      const respuesta = await fetch("/api/cotizador/plan", { method: "POST", body: datos });
      const cuerpo = (await respuesta.json()) as PlanPdf & { error?: string };
      if (!respuesta.ok || cuerpo.error) {
        setErrorPdf(cuerpo.error ?? "No pude leer ese PDF.");
        return;
      }
      set(cambiosDesdePdf(cuerpo));
      setAviso(avisoPdf(cuerpo));
    } catch {
      setErrorPdf("No pude leer ese PDF.");
    } finally {
      setCargando(false);
      if (archivoRef.current) archivoRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Input
          aria-label={`Nombre del plan ${indice + 1}`}
          placeholder={`Plan ${indice + 1}`}
          value={plan.nombre}
          onChange={(e) => set({ nombre: e.target.value })}
          className="font-medium"
        />
        {eliminable && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Eliminar plan ${indice + 1}`}
            onClick={() => eliminarPlan(plan.id)}
          >
            <Trash2Icon />
          </Button>
        )}
      </div>

      <div>
        <input
          ref={archivoRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          aria-label={`PDF del plan ${indice + 1}`}
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            if (archivo) void cargarPdf(archivo);
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={cargando}
          onClick={() => archivoRef.current?.click()}
        >
          <FileUpIcon />
          {cargando ? "Leyendo PDF…" : "Cargar PDF del plan"}
        </Button>
        {aviso && <p className="mt-1.5 text-xs text-muted-foreground">{aviso}</p>}
        {errorPdf && <p className="mt-1.5 text-xs text-destructive">{errorPdf}</p>}
      </div>

      <TarifarioPlan plan={plan} tarifario={tarifario} onChange={set} />

      <div className="grid grid-cols-2 gap-3">
        <IsapreSelect label="Isapre" value={plan.isapreId} onChange={(isapreId) => set({ isapreId })} />
        <Campo
          label="Precio base"
          sufijo="UF"
          inputMode="decimal"
          placeholder="1,8500"
          value={plan.precioBaseUF}
          onChange={(e) => set({ precioBaseUF: e.target.value })}
        />
        <GesBloqueado plan={plan} ges={ges} />
        <Campo
          label="Productos adicionales"
          sufijo="UF"
          inputMode="decimal"
          placeholder="0,0000"
          value={plan.seguroUF}
          onChange={(e) => set({ seguroUF: e.target.value })}
          ayuda="Monto total por contrato"
        />
      </div>
    </div>
  );
}

export function PlanesCard() {
  const planes = useCotizadorStore((s) => s.planes);
  const agregarPlan = useCotizadorStore((s) => s.agregarPlan);
  const [tarifarios, setTarifarios] = useState<TarifarioGuardado[]>([]);
  const ges = useGesIsapres();

  useEffect(() => {
    let vigente = true;
    void listarTarifarios(getSupabase())
      .then((lista) => vigente && setTarifarios(lista))
      .catch(() => vigente && setTarifarios([]));
    return () => {
      vigente = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planes a comparar</CardTitle>
        <CardDescription>
          Hasta {MAX_PLANES} alternativas. Precio final = base × suma de factores + GES por
          beneficiario + productos adicionales.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {planes.map((plan, i) => (
          <div key={plan.id} className="flex flex-col gap-4">
            {i > 0 && <Separator />}
            <PlanEditor
              plan={plan}
              indice={i}
              eliminable={planes.length > 1}
              tarifario={tarifarios.find((item) => item.isapreId === plan.isapreId) ?? null}
              ges={ges}
            />
          </div>
        ))}
        {planes.length < MAX_PLANES && (
          <Button variant="outline" onClick={agregarPlan}>
            <PlusIcon /> Agregar plan
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
