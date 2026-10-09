"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { Campo } from "@/components/calculator/Campo";
import { IsapreSelect } from "@/components/calculator/IsapreSelect";
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
import { formatEnteroInput } from "@/lib/format";
import { leerProspecto, type ErroresProspecto, type ProspectoForm } from "@/lib/prospectoForm";
import { formatearRut } from "@/lib/rut";
import { formatearTelefono } from "@/lib/telefono";
import { useProspectosStore } from "@/store/prospectosStore";
import type { Prospecto } from "@/types/isapre";

import { EtapaSelect } from "./EtapaSelect";

export type ValoresInicialesProspecto = Partial<Omit<ProspectoForm, "etapaId">>;

function formDesde(
  prospecto: Prospecto | undefined,
  iniciales: ValoresInicialesProspecto | undefined,
  etapaPorDefecto: string,
): ProspectoForm {
  if (prospecto) {
    return {
      nombre: prospecto.nombre,
      rut: formatearRut(prospecto.rut),
      telefono: formatearTelefono(prospecto.telefono),
      email: prospecto.email ?? "",
      edad: prospecto.edad?.toString() ?? "",
      rentaImponibleCLP:
        prospecto.rentaImponibleCLP === null ? "" : formatEnteroInput(String(prospecto.rentaImponibleCLP)),
      isapreActual: prospecto.isapreActual,
      cargas: prospecto.cargas.map(String),
      etapaId: prospecto.etapaId,
      proximoContacto: prospecto.proximoContacto ?? "",
      horaContacto: prospecto.horaContacto ?? "",
      ufCierre: prospecto.ufCierre === null ? "" : String(prospecto.ufCierre).replace(".", ","),
      cerradoEn: prospecto.cerradoEn ?? "",
      gclid: prospecto.gclid ?? "",
      utmSource: prospecto.utmSource ?? "",
      utmCampaign: prospecto.utmCampaign ?? "",
      utmKw: prospecto.utmKw ?? "",
    };
  }
  return {
    nombre: "",
    rut: "",
    telefono: "",
    email: "",
    edad: "",
    rentaImponibleCLP: "",
    isapreActual: null,
    cargas: [],
    proximoContacto: "",
    horaContacto: "",
    ufCierre: "",
    cerradoEn: "",
    gclid: "",
    utmSource: "",
    utmCampaign: "",
    utmKw: "",
    ...iniciales,
    etapaId: etapaPorDefecto,
  };
}

const soloDigitos = (v: string) => v.replace(/\D/g, "").slice(0, 3);

interface ProspectoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospecto?: Prospecto;
  valoresIniciales?: ValoresInicialesProspecto;
  onGuardado?: (prospecto: Prospecto) => void;
}

export function ProspectoFormDialog(props: ProspectoFormDialogProps) {
  const { open, onOpenChange, prospecto } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{prospecto ? "Editar prospecto" : "Nuevo prospecto"}</DialogTitle>
          <DialogDescription>Nombre, RUT y teléfono son obligatorios.</DialogDescription>
        </DialogHeader>
        {/* Se monta al abrir para reiniciar el formulario con los valores actuales. */}
        {open && <FormularioProspecto {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function FormularioProspecto({
  onOpenChange,
  prospecto,
  valoresIniciales,
  onGuardado,
}: ProspectoFormDialogProps) {
  const etapas = useProspectosStore((s) => s.etapas);
  const crear = useProspectosStore((s) => s.crearProspecto);
  const actualizar = useProspectosStore((s) => s.actualizarProspecto);
  const etapaPorDefecto = [...etapas].sort((a, b) => a.orden - b.orden)[0]?.id ?? "";
  const etapaId = useId();

  const [form, setForm] = useState(() => formDesde(prospecto, valoresIniciales, etapaPorDefecto));
  const [errores, setErrores] = useState<ErroresProspecto>({});
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const set = (cambios: Partial<ProspectoForm>) => setForm((f) => ({ ...f, ...cambios }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const lectura = leerProspecto(form);
    if (!lectura.ok) {
      setErrores(lectura.errores);
      return;
    }
    setErrores({});
    setGuardando(true);
    setErrorGuardar(null);
    try {
      const guardado = prospecto
        ? await actualizar(prospecto.id, lectura.datos)
        : await crear(lectura.datos);
      onGuardado?.(guardado);
      onOpenChange(false);
    } catch (err) {
      setErrorGuardar(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  const error = (campo: keyof ProspectoForm) =>
    errores[campo] && <span className="text-destructive">{errores[campo]}</span>;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Campo
        label="Nombre completo *"
        value={form.nombre}
        onChange={(e) => set({ nombre: e.target.value })}
        aria-invalid={Boolean(errores.nombre)}
        ayuda={error("nombre")}
        autoComplete="off"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          label="RUT *"
          placeholder="12.345.678-5"
          value={form.rut}
          onChange={(e) => set({ rut: e.target.value })}
          aria-invalid={Boolean(errores.rut)}
          ayuda={error("rut")}
          autoComplete="off"
        />
        <Campo
          label="Teléfono *"
          type="tel"
          inputMode="tel"
          placeholder="9 1234 5678"
          value={form.telefono}
          onChange={(e) => set({ telefono: e.target.value })}
          aria-invalid={Boolean(errores.telefono)}
          ayuda={error("telefono")}
        />
        <Campo
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => set({ email: e.target.value })}
          aria-invalid={Boolean(errores.email)}
          ayuda={error("email")}
        />
        <Campo
          label="Edad"
          sufijo="años"
          inputMode="numeric"
          value={form.edad}
          onChange={(e) => set({ edad: soloDigitos(e.target.value) })}
          aria-invalid={Boolean(errores.edad)}
          ayuda={error("edad")}
        />
        <Campo
          label="Renta imponible"
          sufijo="CLP"
          inputMode="numeric"
          value={form.rentaImponibleCLP}
          onChange={(e) => set({ rentaImponibleCLP: formatEnteroInput(e.target.value) })}
          aria-invalid={Boolean(errores.rentaImponibleCLP)}
          ayuda={error("rentaImponibleCLP")}
        />
        <IsapreSelect
          label="Isapre actual"
          value={form.isapreActual}
          onChange={(isapreActual) => set({ isapreActual })}
          opcionNula="Sin Isapre actual"
          placeholder="Sin Isapre actual"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Cargas ({form.cargas.length})</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => set({ cargas: [...form.cargas, ""] })}
          >
            <PlusIcon /> Agregar carga
          </Button>
        </div>
        {form.cargas.map((edad, i) => (
          <div key={i} className="flex items-end gap-2">
            <Campo
              className="flex-1"
              label={`Edad carga ${i + 1}`}
              sufijo="años"
              inputMode="numeric"
              value={edad}
              onChange={(e) =>
                set({ cargas: form.cargas.map((c, j) => (j === i ? soloDigitos(e.target.value) : c)) })
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Eliminar carga ${i + 1}`}
              onClick={() => set({ cargas: form.cargas.filter((_, j) => j !== i) })}
            >
              <Trash2Icon />
            </Button>
          </div>
        ))}
        {errores.cargas && <p className="text-xs text-destructive">{errores.cargas}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          label="Próximo contacto"
          type="date"
          value={form.proximoContacto}
          onChange={(e) => set({ proximoContacto: e.target.value })}
          aria-invalid={Boolean(errores.proximoContacto)}
          ayuda={error("proximoContacto")}
        />
        <Campo
          label="Hora"
          type="time"
          value={form.horaContacto}
          onChange={(e) => set({ horaContacto: e.target.value })}
          aria-invalid={Boolean(errores.horaContacto)}
          ayuda={error("horaContacto") ?? "Con hora, avisamos 15 minutos antes y a la hora."}
        />
        <Campo
          label="UF del plan cerrado"
          sufijo="UF"
          inputMode="decimal"
          placeholder="3,2000"
          value={form.ufCierre}
          onChange={(e) => set({ ufCierre: e.target.value })}
          aria-invalid={Boolean(errores.ufCierre)}
          ayuda={error("ufCierre") ?? "Cuenta para la meta al cerrar la etapa como ganada."}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={etapaId}>Etapa</Label>
        <EtapaSelect id={etapaId} etapas={etapas} value={form.etapaId} onChange={(id) => set({ etapaId: id })} />
      </div>

      {errorGuardar && (
        <p role="alert" className="text-sm text-destructive">
          {errorGuardar}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
