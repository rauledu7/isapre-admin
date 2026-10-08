"use client";

import { Trash2Icon } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatFechaHora } from "@/lib/format";
import { getSupabase } from "@/lib/supabase/client";
import { crearNota, eliminarNota, listarNotas } from "@/lib/supabase/prospectos";
import type { NotaProspecto } from "@/types/isapre";

export function NotasProspecto({ prospectoId }: { prospectoId: string }) {
  const [notas, setNotas] = useState<NotaProspecto[] | null>(null);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vigente = true;
    listarNotas(getSupabase(), prospectoId)
      .then((n) => vigente && setNotas(n))
      .catch((e: Error) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [prospectoId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const contenido = texto.trim();
    if (!contenido) return;
    setGuardando(true);
    setError(null);
    try {
      const nota = await crearNota(getSupabase(), prospectoId, contenido);
      setNotas((n) => [nota, ...(n ?? [])]);
      setTexto("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la nota");
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(id: string) {
    setError(null);
    try {
      await eliminarNota(getSupabase(), id);
      setNotas((n) => n?.filter((x) => x.id !== id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la nota");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notas</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <Textarea
            aria-label="Nueva nota"
            placeholder="Ej: Llamar el jueves, prefiere red Clínica Alemana…"
            value={texto}
            maxLength={2000}
            onChange={(e) => setTexto(e.target.value)}
          />
          <Button type="submit" size="sm" className="self-end" disabled={guardando || !texto.trim()}>
            {guardando ? "Guardando…" : "Agregar nota"}
          </Button>
        </form>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {notas === null && !error && <p className="text-sm text-muted-foreground">Cargando…</p>}
        {notas?.length === 0 && <p className="text-sm text-muted-foreground">Sin notas todavía.</p>}
        <ul className="flex flex-col gap-3">
          {notas?.map((n) => (
            <li key={n.id} className="flex gap-2 rounded-lg bg-muted/50 p-3">
              <div className="flex-1">
                <p className="text-sm whitespace-pre-wrap">{n.contenido}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatFechaHora(n.creadaEn)}</p>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label="Eliminar nota" onClick={() => void borrar(n.id)}>
                <Trash2Icon />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
