"use client";

import { ArrowLeftIcon, CalculatorIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProspectos } from "@/hooks/useProspectos";
import { formatCLP } from "@/lib/format";
import { formatearRut } from "@/lib/rut";
import { formatearTelefono } from "@/lib/telefono";
import { useCotizadorStore } from "@/store/cotizadorStore";
import { useProspectosStore } from "@/store/prospectosStore";

import { EtapaSelect } from "./EtapaSelect";
import { HistorialCotizaciones } from "./HistorialCotizaciones";
import { NotasProspecto } from "./NotasProspecto";
import { nombreIsapre } from "./ProspectoResumen";
import { ProspectoFormDialog } from "./ProspectoFormDialog";

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="text-sm tabular-nums">{valor}</dd>
    </div>
  );
}

export function FichaProspecto() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { estado, error, etapas, prospectos } = useProspectos();
  const mover = useProspectosStore((s) => s.moverProspecto);
  const eliminar = useProspectosStore((s) => s.eliminarProspecto);
  const cargarEnCotizador = useCotizadorStore((s) => s.cargarDesdeProspecto);
  const [editando, setEditando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  if (estado === "inicial" || estado === "cargando") {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }
  if (estado === "error") return <p className="text-sm text-destructive">{error}</p>;

  const prospecto = prospectos.find((p) => p.id === id);
  if (!prospecto) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm">Prospecto no encontrado.</p>
        <Button variant="outline" nativeButton={false} render={<Link href="/prospectos" />}>
          Volver a prospectos
        </Button>
      </div>
    );
  }

  async function onEliminar() {
    if (!prospecto) return;
    if (!window.confirm(`¿Eliminar a ${prospecto.nombre}? Se borrarán sus notas y cotizaciones.`)) return;
    try {
      await eliminar(prospecto.id);
      router.replace("/prospectos");
    } catch (e) {
      setErrorEliminar(e instanceof Error ? e.message : "No se pudo eliminar");
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/prospectos"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" /> Prospectos
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="mr-auto text-xl font-semibold tracking-tight">{prospecto.nombre}</h1>
          <EtapaSelect
            etapas={etapas}
            value={prospecto.etapaId}
            onChange={(etapaId) => void mover(prospecto.id, etapaId)}
            aria-label="Etapa del prospecto"
            className="w-56"
          />
          <Button
            onClick={() => {
              cargarEnCotizador(prospecto);
              router.push("/cotizador");
            }}
          >
            <CalculatorIcon /> Cotizar
          </Button>
          <Button variant="outline" onClick={() => setEditando(true)}>
            <PencilIcon /> Editar
          </Button>
          <Button variant="ghost" size="icon" aria-label="Eliminar prospecto" onClick={() => void onEliminar()}>
            <Trash2Icon />
          </Button>
        </div>
        {(error || errorEliminar) && <p className="text-sm text-destructive">{errorEliminar ?? error}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Datos</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-3">
                <Dato etiqueta="RUT" valor={formatearRut(prospecto.rut)} />
                <Dato etiqueta="Teléfono" valor={formatearTelefono(prospecto.telefono)} />
                <Dato etiqueta="Email" valor={prospecto.email ?? "—"} />
                <Dato etiqueta="Edad" valor={prospecto.edad === null ? "—" : `${prospecto.edad} años`} />
                <Dato
                  etiqueta="Renta imponible"
                  valor={prospecto.rentaImponibleCLP === null ? "—" : formatCLP(prospecto.rentaImponibleCLP)}
                />
                <Dato etiqueta="Isapre actual" valor={nombreIsapre(prospecto.isapreActual)} />
                <Dato
                  etiqueta="Cargas"
                  valor={
                    prospecto.cargas.length === 0
                      ? "Sin cargas"
                      : prospecto.cargas.map((e) => `${e} años`).join(", ")
                  }
                />
              </dl>
            </CardContent>
          </Card>
          <NotasProspecto prospectoId={prospecto.id} />
        </div>
        <HistorialCotizaciones prospecto={prospecto} />
      </div>

      <ProspectoFormDialog open={editando} onOpenChange={setEditando} prospecto={prospecto} />
    </div>
  );
}
