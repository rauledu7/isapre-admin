"use client";

import { ColumnsIcon, ListIcon, PlusIcon, Settings2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProspectos } from "@/hooks/useProspectos";
import { cn } from "@/lib/utils";

import { EtapasDialog } from "./EtapasDialog";
import { KanbanBoard } from "./KanbanBoard";
import { ListaProspectos } from "./ListaProspectos";
import { ProspectoFormDialog } from "./ProspectoFormDialog";

type Vista = "kanban" | "lista";

export function ProspectosView() {
  const router = useRouter();
  const { estado, error, etapas, prospectos, recargar } = useProspectos();
  const [vista, setVista] = useState<Vista>("kanban");
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [etapasAbierto, setEtapasAbierto] = useState(false);

  if (estado === "inicial" || estado === "cargando") {
    return <p className="text-sm text-muted-foreground">Cargando prospectos…</p>;
  }
  if (estado === "error") {
    return (
      <Card size="sm">
        <CardContent className="flex items-center justify-between gap-4 text-sm">
          <span className="text-destructive">{error}</span>
          <Button variant="outline" size="sm" onClick={() => void recargar()}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setNuevoAbierto(true)}>
          <PlusIcon /> Nuevo prospecto
        </Button>
        <Button variant="outline" onClick={() => setEtapasAbierto(true)}>
          <Settings2Icon /> Etapas
        </Button>
        <div className="ml-auto hidden rounded-lg p-0.5 ring-1 ring-foreground/10 md:flex" role="group" aria-label="Vista">
          {(
            [
              ["kanban", "Kanban", ColumnsIcon],
              ["lista", "Lista", ListIcon],
            ] as const
          ).map(([valor, label, Icon]) => (
            <Button
              key={valor}
              variant="ghost"
              size="sm"
              aria-pressed={vista === valor}
              onClick={() => setVista(valor)}
              className={cn(vista === valor && "bg-muted")}
            >
              <Icon /> {label}
            </Button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {prospectos.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Aún no tienes prospectos. Crea el primero o guarda una cotización desde el Cotizador.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className={cn("hidden", vista === "kanban" && "md:block")}>
            <KanbanBoard etapas={etapas} prospectos={prospectos} />
          </div>
          <div className={cn(vista === "kanban" && "md:hidden")}>
            <ListaProspectos etapas={etapas} prospectos={prospectos} />
          </div>
        </>
      )}

      <ProspectoFormDialog
        open={nuevoAbierto}
        onOpenChange={setNuevoAbierto}
        onGuardado={(p) => router.push(`/prospectos/${p.id}`)}
      />
      <EtapasDialog open={etapasAbierto} onOpenChange={setEtapasAbierto} />
    </div>
  );
}
