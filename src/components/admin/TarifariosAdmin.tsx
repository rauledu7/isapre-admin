"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ISAPRES } from "@/config/isapres";
import type { IsapreId } from "@/types/isapre";

interface TarifarioBase {
  isapreId: IsapreId;
  titulo: string | null;
  planes: number;
  productos: number;
}

async function pedirTarifarios(): Promise<TarifarioBase[]> {
  const respuesta = await fetch("/api/admin/tarifarios");
  const cuerpo = (await respuesta.json()) as { tarifarios?: TarifarioBase[]; error?: string };
  if (!respuesta.ok) throw new Error(cuerpo.error ?? "No se pudieron cargar los tarifarios.");
  return cuerpo.tarifarios ?? [];
}

export function TarifariosAdmin() {
  const [tarifarios, setTarifarios] = useState<TarifarioBase[]>([]);
  const [ocupado, setOcupado] = useState<IsapreId | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    void pedirTarifarios()
      .then((lista) => vigente && setTarifarios(lista))
      .catch((err: unknown) => vigente && setError(err instanceof Error ? err.message : "No se pudieron cargar los tarifarios."));
    return () => {
      vigente = false;
    };
  }, []);

  async function subir(isapreId: IsapreId, archivo: File) {
    setOcupado(isapreId);
    setAviso(null);
    setError(null);
    const datos = new FormData();
    datos.set("isapreId", isapreId);
    datos.set("archivo", archivo);
    try {
      const respuesta = await fetch("/api/admin/tarifarios", { method: "POST", body: datos });
      const cuerpo = (await respuesta.json()) as { error?: string; planes?: number; productos?: number };
      if (!respuesta.ok) {
        setError(cuerpo.error ?? "No se pudo leer el tarifario.");
        return;
      }
      await pedirTarifarios().then(setTarifarios);
      const nombre = ISAPRES.find((isapre) => isapre.id === isapreId)?.nombre ?? "La Isapre";
      setAviso(`${nombre}: ${cuerpo.planes ?? 0} planes y ${cuerpo.productos ?? 0} productos. Quedó para los asesores que no lo hayan cambiado.`);
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
      const respuesta = await fetch(`/api/admin/tarifarios?isapreId=${isapreId}`, { method: "DELETE" });
      const cuerpo = (await respuesta.json()) as { error?: string };
      if (!respuesta.ok) {
        setError(cuerpo.error ?? "No se pudo quitar el tarifario.");
        return;
      }
      setTarifarios((lista) => lista.filter((item) => item.isapreId !== isapreId));
      setAviso("Se quitó el tarifario común. Quien ya lo había reemplazado conserva el suyo.");
    } catch {
      setError("No se pudo quitar el tarifario.");
    } finally {
      setOcupado(null);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-medium">Tarifarios para todos</h2>
        <p className="text-xs text-muted-foreground">
          Al cargarlos quedan en el cotizador de cada asesor. Si alguien reemplaza o quita el de una Isapre, ese cambio queda solo en su cuenta.
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {ISAPRES.map((isapre) => {
          const tarifario = tarifarios.find((item) => item.isapreId === isapre.id);
          const excel = isapre.id === "nueva-masvida";
          return (
            <li key={isapre.id} className="flex flex-col gap-2 rounded-lg border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm">{isapre.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {tarifario
                    ? `${tarifario.planes} planes · ${tarifario.productos} productos`
                    : excel
                      ? "Sin tarifario · Excel"
                      : "Sin tarifario · PDF"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {tarifario && (
                  <Button type="button" variant="ghost" size="sm" disabled={ocupado === isapre.id} onClick={() => void quitar(isapre.id)}>
                    Quitar
                  </Button>
                )}
                <label
                  className={`inline-flex h-7 items-center rounded-lg border px-2.5 text-[0.8rem] ${ocupado === isapre.id ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                >
                  {ocupado === isapre.id ? "Leyendo…" : tarifario ? "Reemplazar" : "Cargar"}
                  <input
                    type="file"
                    accept={
                      excel
                        ? ".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        : "application/pdf"
                    }
                    className="sr-only"
                    disabled={ocupado === isapre.id}
                    aria-label={excel ? `Excel de ${isapre.nombre}` : `PDF de ${isapre.nombre}`}
                    onChange={(e) => {
                      const archivo = e.target.files?.[0];
                      e.target.value = "";
                      if (archivo) void subir(isapre.id, archivo);
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
    </section>
  );
}
