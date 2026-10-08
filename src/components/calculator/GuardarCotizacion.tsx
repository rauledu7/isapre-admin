"use client";

import { SaveIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";

import { ProspectoFormDialog, type ValoresInicialesProspecto } from "@/components/crm/ProspectoFormDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TOPE_IMPONIBLE_SALUD_UF } from "@/config/isapres";
import { useCotizacion } from "@/hooks/useCotizacion";
import { useProspectos } from "@/hooks/useProspectos";
import { formatEnteroInput } from "@/lib/format";
import { formatearRut } from "@/lib/rut";
import { getSupabase } from "@/lib/supabase/client";
import { guardarCotizacion } from "@/lib/supabase/prospectos";
import { useCotizadorStore } from "@/store/cotizadorStore";
import type { Prospecto } from "@/types/isapre";

export function GuardarCotizacion() {
  const cotizacion = useCotizacion();
  const prospectoIdAsociado = useCotizadorStore((s) => s.prospectoId);
  const asociarProspecto = useCotizadorStore((s) => s.asociarProspecto);
  const isapreActual = useCotizadorStore((s) => s.cliente.isapreActual);
  const { estado, prospectos } = useProspectos();
  const selectId = useId();

  const [abierto, setAbierto] = useState(false);
  const [creando, setCreando] = useState(false);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardadoEn, setGuardadoEn] = useState<Prospecto | null>(null);

  const lista = cotizacion.estado === "listo" && cotizacion.resultado.planes.length > 0;
  if (!lista) return null;

  const { datos, resultado, valorUF } = cotizacion;
  const elegido = seleccion ?? prospectoIdAsociado;
  const items = prospectos.map((p) => ({ value: p.id, label: `${p.nombre} · ${formatearRut(p.rut)}` }));

  async function guardarEn(prospecto: Prospecto) {
    setGuardando(true);
    setError(null);
    try {
      await guardarCotizacion(getSupabase(), {
        prospectoId: prospecto.id,
        valorUF,
        topeImponibleUF: TOPE_IMPONIBLE_SALUD_UF,
        entrada: datos,
        resultado,
      });
      asociarProspecto(prospecto.id);
      setGuardadoEn(prospecto);
      setAbierto(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la cotización");
      setAbierto(true);
    } finally {
      setGuardando(false);
    }
  }

  const iniciales: ValoresInicialesProspecto = {
    rentaImponibleCLP: formatEnteroInput(String(datos.rentaImponibleCLP)),
    edad: String(datos.edadTitular),
    isapreActual,
    cargas: datos.edadesCargas.map(String),
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="secondary"
        onClick={() => {
          setGuardadoEn(null);
          setError(null);
          setAbierto(true);
        }}
      >
        <SaveIcon /> Guardar en prospecto
      </Button>
      {guardadoEn && (
        <p className="text-sm text-muted-foreground">
          Cotización guardada en{" "}
          <Link href={`/prospectos/${guardadoEn.id}`} className="font-medium text-foreground underline">
            {guardadoEn.nombre}
          </Link>
          .
        </p>
      )}

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Guardar cotización</DialogTitle>
            <DialogDescription>
              Se guarda una foto de esta cotización (UF del día, datos y resultados) en la ficha del prospecto.
            </DialogDescription>
          </DialogHeader>

          {estado === "cargando" && <p className="text-sm text-muted-foreground">Cargando prospectos…</p>}
          {estado === "listo" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={selectId}>Prospecto</Label>
              {items.length > 0 ? (
                <Select items={items} value={elegido} onValueChange={(v) => setSeleccion(v as string | null)}>
                  <SelectTrigger id={selectId} className="h-8 w-full">
                    <SelectValue placeholder="Selecciona un prospecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((i) => (
                      <SelectItem key={i.value} value={i.value}>
                        {i.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">Aún no tienes prospectos.</p>
              )}
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setAbierto(false);
                setCreando(true);
              }}
            >
              <UserPlusIcon /> Nuevo prospecto
            </Button>
            <Button
              disabled={!elegido || guardando}
              onClick={() => {
                const p = prospectos.find((x) => x.id === elegido);
                if (p) void guardarEn(p);
              }}
            >
              {guardando ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProspectoFormDialog
        open={creando}
        onOpenChange={setCreando}
        valoresIniciales={iniciales}
        onGuardado={(p) => void guardarEn(p)}
      />
    </div>
  );
}
