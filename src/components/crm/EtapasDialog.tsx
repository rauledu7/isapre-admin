"use client";

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProspectosStore } from "@/store/prospectosStore";
import type { TipoEtapa } from "@/types/isapre";

const TIPOS: { value: TipoEtapa; label: string }[] = [
  { value: "abierta", label: "En curso" },
  { value: "ganada", label: "Ganada" },
  { value: "perdida", label: "Perdida" },
];

function TipoSelect({ value, onChange, label }: { value: TipoEtapa; onChange: (t: TipoEtapa) => void; label: string }) {
  return (
    <Select items={TIPOS} value={value} onValueChange={(v) => v && onChange(v as TipoEtapa)}>
      <SelectTrigger aria-label={label} className="h-8 w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TIPOS.map((t) => (
          <SelectItem key={t.value} value={t.value}>
            {t.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function EtapasDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const etapas = useProspectosStore((s) => s.etapas);
  const prospectos = useProspectosStore((s) => s.prospectos);
  const { crearEtapa, actualizarEtapa, reordenarEtapa, eliminarEtapa } = useProspectosStore.getState();
  const [nueva, setNueva] = useState("");
  const [error, setError] = useState<string | null>(null);

  const ordenadas = [...etapas].sort((a, b) => a.orden - b.orden);

  async function ejecutar(accion: () => Promise<void>) {
    setError(null);
    try {
      await accion();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Etapas del embudo</DialogTitle>
          <DialogDescription>
            Renombra, ordena, agrega o elimina etapas. Solo se pueden eliminar etapas sin prospectos.
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-2">
          {ordenadas.map((etapa, i) => {
            const cantidad = prospectos.filter((p) => p.etapaId === etapa.id).length;
            return (
              <li key={etapa.id} className="flex items-center gap-1.5">
                <Input
                  aria-label={`Nombre de la etapa ${i + 1}`}
                  defaultValue={etapa.nombre}
                  onBlur={(e) => {
                    const nombre = e.target.value.trim();
                    if (nombre && nombre !== etapa.nombre) {
                      void ejecutar(() => actualizarEtapa(etapa.id, { nombre }));
                    } else {
                      e.target.value = etapa.nombre;
                    }
                  }}
                />
                <TipoSelect
                  label={`Tipo de ${etapa.nombre}`}
                  value={etapa.tipo}
                  onChange={(tipo) => void ejecutar(() => actualizarEtapa(etapa.id, { tipo }))}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Subir ${etapa.nombre}`}
                  disabled={i === 0}
                  onClick={() => void ejecutar(() => reordenarEtapa(etapa.id, -1))}
                >
                  <ArrowUpIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Bajar ${etapa.nombre}`}
                  disabled={i === ordenadas.length - 1}
                  onClick={() => void ejecutar(() => reordenarEtapa(etapa.id, 1))}
                >
                  <ArrowDownIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Eliminar ${etapa.nombre}`}
                  title={cantidad > 0 ? `Tiene ${cantidad} prospecto(s)` : undefined}
                  disabled={cantidad > 0 || ordenadas.length <= 1}
                  onClick={() => void ejecutar(() => eliminarEtapa(etapa.id))}
                >
                  <Trash2Icon />
                </Button>
              </li>
            );
          })}
        </ul>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const nombre = nueva.trim();
            if (!nombre) return;
            void ejecutar(async () => {
              await crearEtapa(nombre, "abierta");
              setNueva("");
            });
          }}
        >
          <Input
            aria-label="Nombre de la nueva etapa"
            placeholder="Nueva etapa"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
          />
          <Button type="submit" variant="outline">
            <PlusIcon /> Agregar
          </Button>
        </form>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
