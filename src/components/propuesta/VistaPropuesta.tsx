"use client";

import { ArrowLeftIcon, PrinterIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { TOPE_IMPONIBLE_SALUD_UF } from "@/config/isapres";
import { useCotizacion } from "@/hooks/useCotizacion";
import { useProspectos } from "@/hooks/useProspectos";
import { formatFechaHora } from "@/lib/format";
import { getSupabase } from "@/lib/supabase/client";
import { obtenerCotizacion, obtenerProspecto } from "@/lib/supabase/prospectos";
import { useCotizadorStore } from "@/store/cotizadorStore";
import { usePerfilStore } from "@/store/perfilStore";
import type { Prospecto } from "@/types/isapre";

import { AccionesPropuesta, type PropuestaSinAsesor } from "./AccionesPropuesta";
import { PropuestaDocumento } from "./PropuestaDocumento";

export function VistaPropuesta() {
  const cotizacionId = useSearchParams().get("cotizacion");
  return cotizacionId ? <DesdeCotizacionGuardada id={cotizacionId} /> : <DesdeCotizador />;
}

function DesdeCotizador() {
  const cotizacion = useCotizacion();
  const isapreActual = useCotizadorStore((s) => s.cliente.isapreActual);
  const prospectoId = useCotizadorStore((s) => s.prospectoId);
  const { prospectos } = useProspectos();
  const prospecto = prospectos.find((p) => p.id === prospectoId) ?? null;
  const [fecha] = useState(() => formatFechaHora(new Date().toISOString()));

  if (cotizacion.estado !== "listo" || cotizacion.resultado.planes.length === 0) {
    return (
      <Mensaje volver="/cotizador">
        No hay una cotización completa en el Cotizador. Vuelve, completa los datos y genera la propuesta.
      </Mensaje>
    );
  }

  return (
    <Contenido
      volver="/cotizador"
      fecha={fecha}
      prospecto={prospecto}
      propuesta={{
        clienteNombre: prospecto?.nombre ?? null,
        isapreActual,
        valorUF: cotizacion.valorUF,
        topeImponibleUF: TOPE_IMPONIBLE_SALUD_UF,
        resultado: cotizacion.resultado,
      }}
    />
  );
}

type Carga =
  | { estado: "cargando" }
  | { estado: "error"; mensaje: string }
  | { estado: "listo"; propuesta: PropuestaSinAsesor; prospecto: Prospecto; fecha: string };

function DesdeCotizacionGuardada({ id }: { id: string }) {
  const [carga, setCarga] = useState<Carga>({ estado: "cargando" });

  useEffect(() => {
    let vigente = true;
    const sb = getSupabase();
    (async () => {
      const cotizacion = await obtenerCotizacion(sb, id);
      if (!cotizacion) throw new Error("La cotización no existe o no tienes acceso a ella.");
      const prospecto = await obtenerProspecto(sb, cotizacion.prospectoId);
      if (!prospecto) throw new Error("El prospecto de esta cotización ya no existe.");
      return {
        estado: "listo" as const,
        prospecto,
        fecha: formatFechaHora(cotizacion.creadaEn),
        propuesta: {
          clienteNombre: prospecto.nombre,
          isapreActual: prospecto.isapreActual,
          valorUF: cotizacion.valorUF,
          topeImponibleUF: cotizacion.topeImponibleUF,
          resultado: cotizacion.resultado,
        },
      };
    })()
      .then((c) => vigente && setCarga(c))
      .catch((e: Error) => vigente && setCarga({ estado: "error", mensaje: e.message }));
    return () => {
      vigente = false;
    };
  }, [id]);

  if (carga.estado === "cargando") return <Mensaje>Cargando propuesta…</Mensaje>;
  if (carga.estado === "error") return <Mensaje volver="/prospectos">{carga.mensaje}</Mensaje>;
  return (
    <Contenido
      volver={`/prospectos/${carga.prospecto.id}`}
      fecha={carga.fecha}
      prospecto={carga.prospecto}
      propuesta={carga.propuesta}
    />
  );
}

function Mensaje({ children, volver }: { children: React.ReactNode; volver?: string }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm text-muted-foreground">{children}</p>
      {volver && (
        <Button variant="outline" nativeButton={false} render={<Link href={volver} />}>
          <ArrowLeftIcon /> Volver
        </Button>
      )}
    </div>
  );
}

interface ContenidoProps {
  volver: string;
  fecha: string;
  prospecto: Prospecto | null;
  propuesta: PropuestaSinAsesor;
}

function Contenido({ volver, fecha, prospecto, propuesta }: ContenidoProps) {
  const asesor = usePerfilStore((s) => s.perfil);
  const estadoPerfil = usePerfilStore((s) => s.estado);

  useEffect(() => {
    const anterior = document.title;
    document.title = `Propuesta ${propuesta.clienteNombre ?? "plan de salud"} - ${fecha}`;
    return () => {
      document.title = anterior;
    };
  }, [propuesta.clienteNombre, fecha]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button variant="ghost" nativeButton={false} render={<Link href={volver} />}>
          <ArrowLeftIcon /> Volver
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <AccionesPropuesta propuesta={propuesta} telefono={prospecto?.telefono ?? null} />
          <Button onClick={() => window.print()}>
            <PrinterIcon /> Imprimir / Guardar PDF
          </Button>
        </div>
      </div>
      {estadoPerfil === "listo" && !asesor && (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm print:hidden">
          Agrega tu nombre y contacto en “Mis datos de asesor” (menú superior) para firmar la propuesta.
        </p>
      )}
      <PropuestaDocumento propuesta={{ ...propuesta, asesor }} fecha={fecha} />
    </div>
  );
}
