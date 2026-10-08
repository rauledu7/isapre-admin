"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { MAX_PLANES, useCotizadorStore } from "@/store/cotizadorStore";
import type { PlanForm } from "@/types/cotizador";

import { Campo } from "./Campo";
import { IsapreSelect } from "./IsapreSelect";

function PlanEditor({ plan, indice, eliminable }: { plan: PlanForm; indice: number; eliminable: boolean }) {
  const actualizarPlan = useCotizadorStore((s) => s.actualizarPlan);
  const eliminarPlan = useCotizadorStore((s) => s.eliminarPlan);
  const set = (cambios: Partial<Omit<PlanForm, "id">>) => actualizarPlan(plan.id, cambios);

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
        <Campo
          label="GES"
          sufijo="UF"
          inputMode="decimal"
          placeholder="0,0000"
          value={plan.gesUF}
          onChange={(e) => set({ gesUF: e.target.value })}
          ayuda="Por beneficiario"
        />
        <Campo
          label="CAEC"
          sufijo="UF"
          inputMode="decimal"
          placeholder="0,0000"
          value={plan.caecUF}
          onChange={(e) => set({ caecUF: e.target.value })}
          ayuda="Por beneficiario"
        />
        <Campo
          className="col-span-2"
          label="Seguros adicionales"
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planes a comparar</CardTitle>
        <CardDescription>
          Hasta {MAX_PLANES} alternativas. Precio final = base × suma de factores + GES/CAEC por
          beneficiario + seguros.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {planes.map((plan, i) => (
          <div key={plan.id} className="flex flex-col gap-4">
            {i > 0 && <Separator />}
            <PlanEditor plan={plan} indice={i} eliminable={planes.length > 1} />
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
