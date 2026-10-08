"use client";

import { AccionesPropuesta } from "@/components/propuesta/AccionesPropuesta";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TOPE_IMPONIBLE_SALUD_UF } from "@/config/isapres";
import { useCotizacion } from "@/hooks/useCotizacion";
import { useCotizadorStore } from "@/store/cotizadorStore";
import { useProspectosStore } from "@/store/prospectosStore";

import { GuardarCotizacion } from "./GuardarCotizacion";

export function PropuestaCotizador() {
  const cotizacion = useCotizacion();
  const isapreActual = useCotizadorStore((s) => s.cliente.isapreActual);
  const prospectoId = useCotizadorStore((s) => s.prospectoId);
  const prospecto = useProspectosStore((s) => s.prospectos.find((p) => p.id === prospectoId)) ?? null;

  if (cotizacion.estado !== "listo" || cotizacion.resultado.planes.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Propuesta al cliente</CardTitle>
        <CardDescription>
          {prospecto
            ? `Envíala a ${prospecto.nombre} por WhatsApp, descárgala en PDF o guárdala en su ficha.`
            : "Envíala por WhatsApp, descárgala en PDF o guárdala en un prospecto."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <AccionesPropuesta
          telefono={prospecto?.telefono ?? null}
          hrefPdf="/propuesta"
          propuesta={{
            clienteNombre: prospecto?.nombre ?? null,
            isapreActual,
            valorUF: cotizacion.valorUF,
            topeImponibleUF: TOPE_IMPONIBLE_SALUD_UF,
            resultado: cotizacion.resultado,
          }}
        />
        <GuardarCotizacion />
      </CardContent>
    </Card>
  );
}
