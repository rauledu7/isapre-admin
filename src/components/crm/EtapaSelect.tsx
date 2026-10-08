"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { EtapaEmbudo } from "@/types/isapre";

interface EtapaSelectProps {
  etapas: EtapaEmbudo[];
  value: string;
  onChange: (etapaId: string) => void;
  id?: string;
  className?: string;
  "aria-label"?: string;
}

export function EtapaSelect({ etapas, value, onChange, id, className, ...props }: EtapaSelectProps) {
  const items = [...etapas]
    .sort((a, b) => a.orden - b.orden)
    .map((e) => ({ value: e.id, label: e.nombre }));

  return (
    <Select items={items} value={value} onValueChange={(v) => v && onChange(v as string)}>
      <SelectTrigger id={id} aria-label={props["aria-label"]} className={cn("h-8 w-full", className)}>
        <SelectValue placeholder="Selecciona etapa" />
      </SelectTrigger>
      <SelectContent>
        {items.map((i) => (
          <SelectItem key={i.value} value={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
