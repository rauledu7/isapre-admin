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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mis datos de asesor</DialogTitle>
          <DialogDescription>Aparecen como firma en las propuestas que envías a tus clientes.</DialogDescription>
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
  const [errores, setErrores] = useState<{ nombre?: string; telefono?: string; email?: string }>({});
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
    const nuevos = {
      ...(nombre.trim() === "" && { nombre: "Ingresa tu nombre" }),
      ...(conTelefono && tel === null && { telefono: "Teléfono chileno inválido" }),
      ...(email.trim() !== "" && !EMAIL_RE.test(email.trim()) && { email: "Email inválido" }),
    };
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setGuardando(true);
    setError(null);
    try {
      await guardar({ nombre: nombre.trim(), telefono: tel, email: email.trim() || null });
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
