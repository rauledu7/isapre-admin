import { PhoneIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ISAPRES } from "@/config/isapres";
import { useFechaHoy } from "@/hooks/useFechaHoy";
import { estaVencido } from "@/lib/calendario";
import { formatFecha } from "@/lib/fecha";
import { formatCLP } from "@/lib/format";
import { formatearRut } from "@/lib/rut";
import { formatearTelefono } from "@/lib/telefono";
import { cn } from "@/lib/utils";
import type { Prospecto } from "@/types/isapre";

export function MarcaWeb({ origen }: { origen: Prospecto["origen"] }) {
  if (origen !== "web") return null;
  return <Badge variant="secondary">Web</Badge>;
}

export function nombreIsapre(id: Prospecto["isapreActual"]): string {
  return ISAPRES.find((i) => i.id === id)?.nombre ?? "Sin Isapre";
}

/** Línea secundaria compacta: RUT, teléfono, Isapre y renta. */
export function ProspectoResumen({ prospecto }: { prospecto: Prospecto }) {
  const hoy = useFechaHoy();
  return (
    <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
      <span className="tabular-nums">{formatearRut(prospecto.rut)}</span>
      <span className="flex items-center gap-1 tabular-nums">
        <PhoneIcon className="size-3" aria-hidden />
        {formatearTelefono(prospecto.telefono)}
      </span>
      <span>
        {nombreIsapre(prospecto.isapreActual)}
        {prospecto.rentaImponibleCLP !== null && ` · ${formatCLP(prospecto.rentaImponibleCLP)}`}
      </span>
      {prospecto.proximoContacto && (
        <span className={cn("tabular-nums", hoy && estaVencido(prospecto.proximoContacto, hoy) && "text-alerta")}>
          Contacto {formatFecha(prospecto.proximoContacto)}
          {prospecto.horaContacto ? ` ${prospecto.horaContacto}` : ""}
        </span>
      )}
    </div>
  );
}
