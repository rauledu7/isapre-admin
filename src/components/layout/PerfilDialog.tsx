"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Campo } from "@/components/calculator/Campo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseDecimal, parseEntero } from "@/lib/format";
import { getSupabase } from "@/lib/supabase/client";
import { formatearTelefono, normalizarTelefono } from "@/lib/telefono";
import { usePerfilStore } from "@/store/perfilStore";

interface PerfilDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PerfilDialog({ open, onOpenChange }: PerfilDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mis datos de asesor</DialogTitle>
          <DialogDescription>
            Firman las propuestas y definen la meta de UF y contratos del mes.
          </DialogDescription>
        </DialogHeader>
        {open && <FormularioPerfil onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function FormularioPerfil({ onOpenChange }: Pick<PerfilDialogProps, "onOpenChange">) {
  const perfil = usePerfilStore((s) => s.perfil);
  const guardar = usePerfilStore((s) => s.guardar);

  const [nombre, setNombre] = useState(perfil?.nombre ?? "");
  const [telefono, setTelefono] = useState(perfil?.telefono ? formatearTelefono(perfil.telefono) : "");
  const [email, setEmail] = useState(perfil?.email ?? "");
  const [metaUf, setMetaUf] = useState(perfil?.metaUfMes === null || perfil?.metaUfMes === undefined ? "" : String(perfil.metaUfMes).replace(".", ","));
  const [metaContratos, setMetaContratos] = useState(
    perfil?.metaContratosMes === null || perfil?.metaContratosMes === undefined ? "" : String(perfil.metaContratosMes),
  );
  const [errores, setErrores] = useState<{
    nombre?: string;
    telefono?: string;
    email?: string;
    metaUf?: string;
    metaContratos?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const sinPerfil = perfil === null;
  useEffect(() => {
    if (!sinPerfil) return;
    let vigente = true;
    void getSupabase()
      .auth.getUser()
      .then(({ data }) => vigente && setEmail((actual) => actual || data.user?.email || ""));
    return () => {
      vigente = false;
    };
  }, [sinPerfil]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const conTelefono = telefono.trim() !== "";
    const tel = conTelefono ? normalizarTelefono(telefono) : null;
    const uf = metaUf.trim() === "" ? null : parseDecimal(metaUf);
    const contratos = metaContratos.trim() === "" ? null : parseEntero(metaContratos);
    const nuevos = {
      ...(nombre.trim() === "" && { nombre: "Ingresa tu nombre" }),
      ...(conTelefono && tel === null && { telefono: "Teléfono chileno inválido" }),
      ...(email.trim() !== "" && !EMAIL_RE.test(email.trim()) && { email: "Email inválido" }),
      ...(metaUf.trim() !== "" && (uf === null || uf < 0) && { metaUf: "UF inválida" }),
      ...(metaContratos.trim() !== "" && contratos === null && { metaContratos: "Número inválido" }),
    };
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setGuardando(true);
    setError(null);
    try {
      await guardar({
        nombre: nombre.trim(),
        telefono: tel,
        email: email.trim() || null,
        metaUfMes: uf,
        metaContratosMes: contratos,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  const ayuda = (m?: string) => m && <span className="text-destructive">{m}</span>;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Campo
        label="Nombre *"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        aria-invalid={Boolean(errores.nombre)}
        ayuda={ayuda(errores.nombre)}
        autoComplete="name"
      />
      <Campo
        label="Teléfono"
        type="tel"
        inputMode="tel"
        placeholder="9 1234 5678"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
        aria-invalid={Boolean(errores.telefono)}
        ayuda={ayuda(errores.telefono)}
        autoComplete="tel"
      />
      <Campo
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={Boolean(errores.email)}
        ayuda={ayuda(errores.email)}
        autoComplete="email"
      />
      <Campo
        label="Meta de UF cerradas al mes"
        sufijo="UF"
        inputMode="decimal"
        placeholder="10,0000"
        value={metaUf}
        onChange={(e) => setMetaUf(e.target.value)}
        aria-invalid={Boolean(errores.metaUf)}
        ayuda={ayuda(errores.metaUf)}
      />
      <Campo
        label="Meta de contratos al mes"
        inputMode="numeric"
        placeholder="8"
        value={metaContratos}
        onChange={(e) => setMetaContratos(e.target.value.replace(/\D/g, ""))}
        aria-invalid={Boolean(errores.metaContratos)}
        ayuda={ayuda(errores.metaContratos)}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
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
