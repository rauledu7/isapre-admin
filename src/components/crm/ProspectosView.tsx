"use client";

import { ColumnsIcon, ListIcon, PlusIcon, SearchIcon, Settings2Icon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useProspectos } from "@/hooks/useProspectos";
import { filtrarProspectos } from "@/lib/busqueda";
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
  const [busqueda, setBusqueda] = useState("");
  const filtrados = useMemo(() => filtrarProspectos(prospectos, busqueda), [prospectos, busqueda]);

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
        <div className="relative w-full sm:w-72">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="text"
            enterKeyHint="search"
            autoComplete="off"
            aria-label="Buscar prospecto por nombre o RUT"
            placeholder="Buscar por nombre o RUT"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pr-8 pl-8"
          />
          {busqueda && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Limpiar búsqueda"
              className="absolute top-1/2 right-1.5 -translate-y-1/2"
              onClick={() => setBusqueda("")}
            >
              <XIcon />
            </Button>
          )}
        </div>
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
      ) : filtrados.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Ningún prospecto coincide con “{busqueda.trim()}”.
          </CardContent>
        </Card>
      ) : (
        <>
          {busqueda.trim() && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {filtrados.length} de {prospectos.length} prospectos
            </p>
          )}
          <div className={cn("hidden", vista === "kanban" && "md:block")}>
            <KanbanBoard etapas={etapas} prospectos={filtrados} />
          </div>
          <div className={cn(vista === "kanban" && "md:hidden")}>
            <ListaProspectos etapas={etapas} prospectos={filtrados} />
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
