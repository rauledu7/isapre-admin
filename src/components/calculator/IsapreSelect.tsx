"use client";

import { useId } from "react";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ISAPRES } from "@/config/isapres";
import type { IsapreId } from "@/types/isapre";

interface IsapreSelectProps {
  label: string;
  value: IsapreId | null;
  onChange: (valor: IsapreId | null) => void;
  /** Agrega una opción explícita "sin Isapre" con valor `null`. */
  opcionNula?: string;
  placeholder?: string;
}

export function IsapreSelect({
  label,
  value,
  onChange,
  opcionNula,
  placeholder = "Selecciona Isapre",
}: IsapreSelectProps) {
  const id = useId();
  const items = [
    ...(opcionNula ? [{ value: null, label: opcionNula }] : []),
    ...ISAPRES.map((i) => ({ value: i.id, label: i.nombre })),
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select items={items} value={value} onValueChange={(v) => onChange(v as IsapreId | null)}>
        <SelectTrigger id={id} className="h-8 w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value ?? "ninguna"} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
