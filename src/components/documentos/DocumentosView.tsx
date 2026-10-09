"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TIPOS_DOCUMENTO, nombreTipoDocumento, type TipoDocumento } from "@/config/documentos";
import { useProspectos } from "@/hooks/useProspectos";
import { formatFecha } from "@/lib/fecha";
import { listarDocumentos, urlDocumento, type Documento } from "@/lib/supabase/documentos";

import { VistaPrevia } from "./VistaPrevia";

export function DocumentosView() {
  const { prospectos } = useProspectos();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState<TipoDocumento | "">("");
  const [vista, setVista] = useState<{ nombre: string; mime: string; url: string } | null>(null);

  useEffect(() => {
    let vivo = true;
    void listarDocumentos()
      .then((lista) => {
        if (vivo) setDocumentos(lista);
      })
      .catch((e: Error) => {
        if (vivo) setError(e.message);
      });
    return () => {
      vivo = false;
    };
  }, []);

  const porProspecto = useMemo(() => new Map(prospectos.map((p) => [p.id, p])), [prospectos]);
  const consulta = busqueda.trim().toLowerCase();
  const visibles = documentos.filter((documento) => {
    if (tipo && documento.tipo !== tipo) return false;
    if (!consulta) return true;
    const prospecto = porProspecto.get(documento.prospectoId);
    const texto = `${prospecto?.nombre ?? ""} ${prospecto?.rut ?? ""} ${documento.nombre}`.toLowerCase();
    return texto.includes(consulta);
  });

  async function abrir(documento: Documento) {
    setError(null);
    try {
      const url = await urlDocumento(documento.filePath);
      setVista({ nombre: documento.nombre, mime: documento.mime, url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo abrir");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o RUT"
          aria-label="Buscar documento por nombre o RUT"
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoDocumento | "")}
          aria-label="Tipo de documento"
          className="h-8 rounded-lg border bg-background px-2 text-sm"
        >
          <option value="">Todos los tipos</option>
          {TIPOS_DOCUMENTO.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {visibles.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay documentos con ese filtro.</p>
      ) : (
        <ul className="flex flex-col divide-y rounded-xl ring-1 ring-foreground/10">
          {visibles.map((documento) => {
            const prospecto = porProspecto.get(documento.prospectoId);
            return (
              <li key={documento.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                <Button variant="link" className="h-auto p-0" onClick={() => void abrir(documento)}>
                  {documento.nombre}
                </Button>
                <span className="text-muted-foreground">{nombreTipoDocumento(documento.tipo)}</span>
                {prospecto && (
                  <Link href={`/prospectos/${prospecto.id}`} className="text-muted-foreground hover:underline">
                    {prospecto.nombre}
                  </Link>
                )}
                <span className="ml-auto tabular-nums text-muted-foreground">{formatFecha(documento.creadoEn.slice(0, 10))}</span>
              </li>
            );
          })}
        </ul>
      )}
      <VistaPrevia
        abierta={vista !== null}
        nombre={vista?.nombre ?? ""}
        mime={vista?.mime ?? ""}
        url={vista?.url ?? null}
        onCerrar={() => setVista(null)}
      />
    </div>
  );
}
