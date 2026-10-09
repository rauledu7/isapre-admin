"use client";

import { LockIcon, LockOpenIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GES_UF, ISAPRES } from "@/config/isapres";
import { parseDecimal } from "@/lib/format";
import { getSupabase } from "@/lib/supabase/client";
import { listarGesIsapres } from "@/lib/supabase/ges";
import { listarTarifarios, type TarifarioGuardado } from "@/lib/supabase/tarifarios";
import type { IsapreId } from "@/types/isapre";

function textoUF(valor: number): string {
  return valor.toLocaleString("es-CL", { maximumFractionDigits: 4, useGrouping: false });
}

function CampoGes({
  isapreId,
  nombre,
  valor,
  onGuardar,
}: {
  isapreId: IsapreId;
  nombre: string;
  valor: number;
  onGuardar: (isapreId: IsapreId, texto: string) => Promise<string | null>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function cerrar() {
    setGuardando(true);
    const fallo = await onGuardar(isapreId, texto);
    setGuardando(false);
    if (fallo) {
      setError(fallo);
      return;
    }
    setAbierto(false);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <span className="w-8 text-xs text-muted-foreground">GES</span>
        <div className="relative w-24">
          <Input
            inputMode="decimal"
            readOnly={!abierto}
            disabled={guardando}
            value={abierto ? texto : textoUF(valor)}
            onChange={(e) => setTexto(e.target.value)}
            aria-label={`GES de ${nombre}`}
            className="h-7 pr-7 text-sm tabular-nums"
          />
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[0.7rem] text-muted-foreground">
            UF
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={guardando}
          aria-pressed={abierto}
          aria-label={abierto ? `Bloquear GES de ${nombre}` : `Desbloquear GES de ${nombre}`}
          onClick={() => {
            if (abierto) {
              void cerrar();
              return;
            }
            setTexto(textoUF(valor));
            setError(null);
            setAbierto(true);
          }}
        >
          {abierto ? <LockOpenIcon /> : <LockIcon />}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function TarifariosAsesor() {
  const [tarifarios, setTarifarios] = useState<TarifarioGuardado[]>([]);
  const [ges, setGes] = useState<Partial<Record<IsapreId, number>>>({});
  const [ocupado, setOcupado] = useState<IsapreId | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    void listarTarifarios(getSupabase())
      .then((lista) => vigente && setTarifarios(lista))
      .catch((err: unknown) => vigente && setError(err instanceof Error ? err.message : "No se pudieron cargar los tarifarios"));
    void listarGesIsapres(getSupabase())
      .then((mapa) => vigente && setGes(mapa))
      .catch((err: unknown) => vigente && setError(err instanceof Error ? err.message : "No se pudo cargar el GES"));
    return () => {
      vigente = false;
    };
  }, []);

  async function guardarGes(isapreId: IsapreId, texto: string): Promise<string | null> {
    const actual = ges[isapreId] ?? GES_UF[isapreId];
    if (texto.trim() === textoUF(actual)) return null;
    const valor = parseDecimal(texto);
    if (valor === null || valor <= 0 || valor >= 20) return "Escribe el GES en UF, mayor que 0 y menor que 20.";
    const respuesta = await fetch("/api/ges", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isapreId, gesUF: valor }),
    });
    const cuerpo = (await respuesta.json()) as { error?: string };
    if (!respuesta.ok) return cuerpo.error ?? "No se pudo guardar el GES.";
    setGes((mapa) => ({ ...mapa, [isapreId]: valor }));
    return null;
  }

  async function cargar(isapreId: IsapreId, archivo: File) {
    setOcupado(isapreId);
    setAviso(null);
    setError(null);
    const datos = new FormData();
    datos.set("isapreId", isapreId);
    datos.set("archivo", archivo);
    try {
      const respuesta = await fetch("/api/tarifarios", { method: "POST", body: datos });
      const cuerpo = (await respuesta.json()) as { error?: string; planes?: number; productos?: number; titulo?: string | null };
      if (!respuesta.ok) {
        setError(cuerpo.error ?? "No se pudo leer el tarifario.");
        return;
      }
      const lista = await listarTarifarios(getSupabase());
      setTarifarios(lista);
      const nombre = ISAPRES.find((isapre) => isapre.id === isapreId)?.nombre ?? "La Isapre";
      setAviso(
        `${nombre}: ${cuerpo.planes ?? 0} planes y ${cuerpo.productos ?? 0} productos${cuerpo.titulo ? ` · ${cuerpo.titulo}` : ""}.`,
      );
    } catch {
      setError("No se pudo leer el tarifario.");
    } finally {
      setOcupado(null);
    }
  }

  async function quitar(isapreId: IsapreId) {
    setOcupado(isapreId);
    setAviso(null);
    setError(null);
    try {
      const respuesta = await fetch(`/api/tarifarios?isapreId=${isapreId}`, { method: "DELETE" });
      const cuerpo = (await respuesta.json()) as { error?: string };
      if (!respuesta.ok) {
        setError(cuerpo.error ?? "No se pudo quitar el tarifario.");
        return;
      }
      setTarifarios((lista) => lista.filter((item) => item.isapreId !== isapreId));
    } catch {
      setError("No se pudo quitar el tarifario.");
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {ISAPRES.map((isapre) => {
          const tarifario = tarifarios.find((item) => item.isapreId === isapre.id);
          return (
            <li key={isapre.id} className="flex flex-col gap-2 rounded-lg border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm">{isapre.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {tarifario
                    ? `${tarifario.planes.length} planes · ${tarifario.productos.length} productos`
                    : "Sin tarifario"}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-1">
                <CampoGes
                  isapreId={isapre.id}
                  nombre={isapre.nombre}
                  valor={ges[isapre.id] ?? GES_UF[isapre.id]}
                  onGuardar={guardarGes}
                />
                {tarifario && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={ocupado === isapre.id}
                    onClick={() => void quitar(isapre.id)}
                  >
                    Quitar
                  </Button>
                )}
                <label
                  className={`inline-flex h-7 items-center rounded-lg border px-2.5 text-[0.8rem] ${ocupado === isapre.id ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                >
                  {ocupado === isapre.id ? "Leyendo…" : tarifario ? "Reemplazar" : "Cargar"}
                  <input
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    disabled={ocupado === isapre.id}
                    aria-label={`Tarifario de ${isapre.nombre}`}
                    onChange={(e) => {
                      const archivo = e.target.files?.[0];
                      e.target.value = "";
                      if (archivo) void cargar(isapre.id, archivo);
                    }}
                  />
                </label>
              </div>
            </li>
          );
        })}
      </ul>
      {aviso && <p className="text-xs text-muted-foreground">{aviso}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
