"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { agruparPorEtapa } from "@/lib/embudo";
import { useProspectosStore } from "@/store/prospectosStore";
import type { EtapaEmbudo, Prospecto } from "@/types/isapre";

import { EtapaSelect } from "./EtapaSelect";
import { ProspectoResumen } from "./ProspectoResumen";

export function ListaProspectos({ etapas, prospectos }: { etapas: EtapaEmbudo[]; prospectos: Prospecto[] }) {
  const mover = useProspectosStore((s) => s.moverProspecto);

  return (
    <div className="flex flex-col gap-5">
      {agruparPorEtapa(etapas, prospectos)
        .filter((g) => g.prospectos.length > 0)
        .map(({ etapa, prospectos: lista }) => (
          <section key={etapa.id} aria-label={etapa.nombre} className="flex flex-col gap-2">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              {etapa.nombre}
              <Badge variant="secondary" className="tabular-nums">
                {lista.length}
              </Badge>
            </h2>
            <ul className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
              {lista.map((p) => (
                <li key={p.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <Link href={`/prospectos/${p.id}`} className="flex flex-col gap-1 hover:underline">
                    <span className="text-sm font-medium">{p.nombre}</span>
                    <ProspectoResumen prospecto={p} />
                  </Link>
                  <EtapaSelect
                    etapas={etapas}
                    value={p.etapaId}
                    onChange={(etapaId) => void mover(p.id, etapaId)}
                    aria-label={`Etapa de ${p.nombre}`}
                    className="sm:w-52"
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
