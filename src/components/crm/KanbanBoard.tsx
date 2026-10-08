"use client";

import Link from "next/link";
import { useState, type DragEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { CLASE_PUNTO_ETAPA } from "@/config/ui";
import { agruparPorEtapa } from "@/lib/embudo";
import { cn } from "@/lib/utils";
import { useProspectosStore } from "@/store/prospectosStore";
import type { EtapaEmbudo, Prospecto } from "@/types/isapre";

import { ProspectoResumen } from "./ProspectoResumen";

const MIME = "application/x-prospecto-id";

export function KanbanBoard({ etapas, prospectos }: { etapas: EtapaEmbudo[]; prospectos: Prospecto[] }) {
  const mover = useProspectosStore((s) => s.moverProspecto);
  const [sobre, setSobre] = useState<string | null>(null);

  const onDrop = (etapaId: string) => (e: DragEvent) => {
    e.preventDefault();
    setSobre(null);
    const id = e.dataTransfer.getData(MIME);
    if (id) void mover(id, etapaId);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-3">
      {agruparPorEtapa(etapas, prospectos).map(({ etapa, prospectos: lista }) => (
        <section
          key={etapa.id}
          aria-label={etapa.nombre}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes(MIME)) return;
            e.preventDefault();
            setSobre(etapa.id);
          }}
          onDragLeave={() => setSobre((s) => (s === etapa.id ? null : s))}
          onDrop={onDrop(etapa.id)}
          className={cn(
            "flex w-64 shrink-0 flex-col gap-2 rounded-xl bg-muted/50 p-2 transition-colors",
            sobre === etapa.id && "bg-muted ring-2 ring-ring/40",
          )}
        >
          <header className="flex items-center justify-between px-1 py-1">
            <h2 className="flex min-w-0 items-center gap-2 text-sm font-medium">
              <span aria-hidden className={cn("size-2 shrink-0 rounded-full", CLASE_PUNTO_ETAPA[etapa.tipo])} />
              <span className="truncate">{etapa.nombre}</span>
            </h2>
            <Badge variant="secondary" className="tabular-nums">
              {lista.length}
            </Badge>
          </header>
          {lista.map((p) => (
            <Link
              key={p.id}
              href={`/prospectos/${p.id}`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(MIME, p.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              className="flex cursor-grab flex-col gap-1.5 rounded-lg bg-card p-3 text-sm shadow-xs ring-1 ring-foreground/10 hover:ring-foreground/25 active:cursor-grabbing"
            >
              <span className="font-medium">{p.nombre}</span>
              <ProspectoResumen prospecto={p} />
            </Link>
          ))}
          {lista.length === 0 && (
            <p className="px-1 py-4 text-center text-xs text-muted-foreground">Arrastra aquí</p>
          )}
        </section>
      ))}
    </div>
  );
}
