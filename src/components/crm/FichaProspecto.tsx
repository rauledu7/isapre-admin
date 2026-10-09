"use client";

import { ArrowLeftIcon, CalculatorIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProspectos } from "@/hooks/useProspectos";
import { Campo } from "@/components/calculator/Campo";
import { formatFecha } from "@/lib/fecha";
import { formatCLP, parseDecimal } from "@/lib/format";
import { formatearRut } from "@/lib/rut";
import { formatearTelefono } from "@/lib/telefono";
import { useCotizadorStore } from "@/store/cotizadorStore";
import { useProspectosStore } from "@/store/prospectosStore";

import { EtapaSelect } from "./EtapaSelect";
import { HistorialCotizaciones } from "./HistorialCotizaciones";
import { DocumentosProspecto } from "./DocumentosProspecto";
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
  const actualizar = useProspectosStore((s) => s.actualizarProspecto);
  const eliminar = useProspectosStore((s) => s.eliminarProspecto);
  const cargarEnCotizador = useCotizadorStore((s) => s.cargarDesdeProspecto);
  const [editando, setEditando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);
  const [ufCierre, setUfCierre] = useState("");
  const [ufLista, setUfLista] = useState<number | null>(null);

  if (estado === "inicial" || estado === "cargando") {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }
  if (estado === "error") return <p className="text-sm text-destructive">{error}</p>;

  const prospecto = prospectos.find((p) => p.id === id);
  if (prospecto && prospecto.ufCierre !== ufLista) {
    setUfLista(prospecto.ufCierre);
    setUfCierre(prospecto.ufCierre === null ? "" : String(prospecto.ufCierre).replace(".", ","));
  }
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
              {(prospecto.gclid || prospecto.utmSource || prospecto.utmCampaign || prospecto.utmKw) && (
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
                  <Dato etiqueta="Origen" valor={prospecto.utmSource ?? "—"} />
                  <Dato etiqueta="Campaña" valor={prospecto.utmCampaign ?? "—"} />
                  <Dato etiqueta="Palabra clave" valor={prospecto.utmKw ?? "—"} />
                  <Dato etiqueta="gclid" valor={prospecto.gclid ?? "—"} />
                </dl>
              )}
              <div className="mt-4 flex flex-col gap-3 border-t pt-4">
                <Campo
                  label="Próximo contacto"
                  type="date"
                  value={prospecto.proximoContacto ?? ""}
                  onChange={(e) =>
                    void actualizar(prospecto.id, { proximoContacto: e.target.value || null }).catch((err: Error) =>
                      setErrorEliminar(err.message),
                    )
                  }
                  ayuda="Aparece en el calendario de seguimientos."
                />
                <Campo
                  label="Hora"
                  type="time"
                  value={prospecto.horaContacto ?? ""}
                  onChange={(e) =>
                    void actualizar(prospecto.id, { horaContacto: e.target.value || null }).catch((err: Error) =>
                      setErrorEliminar(err.message),
                    )
                  }
                  ayuda="Con hora, avisamos 15 minutos antes y a la hora."
                />
                {etapas.find((e) => e.id === prospecto.etapaId)?.tipo === "ganada" && (
                  <>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Cerrado el </span>
                      <span className="tabular-nums">
                        {prospecto.cerradoEn ? formatFecha(prospecto.cerradoEn) : "—"}
                      </span>
                    </p>
                    <Campo
                      label="UF del plan cerrado"
                      sufijo="UF"
                      inputMode="decimal"
                      placeholder="3,2000"
                      value={ufCierre}
                      onChange={(e) => setUfCierre(e.target.value)}
                      onBlur={() => {
                        const valor = ufCierre.trim() === "" ? null : parseDecimal(ufCierre);
                        if (ufCierre.trim() !== "" && valor === null) {
                          setErrorEliminar("UF del plan cerrado inválida");
                          return;
                        }
                        void actualizar(prospecto.id, { ufCierre: valor }).catch((err: Error) =>
                          setErrorEliminar(err.message),
                        );
                      }}
                      ayuda="Suma a la meta de UF del mes en que se cerró."
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          <NotasProspecto prospectoId={prospecto.id} />
          <DocumentosProspecto prospectoId={prospecto.id} />
        </div>
        <HistorialCotizaciones prospecto={prospecto} />
      </div>

      <ProspectoFormDialog open={editando} onOpenChange={setEditando} prospecto={prospecto} />
    </div>
  );
}
