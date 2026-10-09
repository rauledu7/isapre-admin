"use client";

import { FileUpIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState, type DragEvent } from "react";

import { VistaPrevia } from "@/components/documentos/VistaPrevia";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TIPOS_DOCUMENTO, type TipoDocumento } from "@/config/documentos";
import { formatFecha } from "@/lib/fecha";
import { eliminarDocumento, listarDocumentos, subirDocumento, urlDocumento, type Documento } from "@/lib/supabase/documentos";
import { cn } from "@/lib/utils";

export function DocumentosProspecto({ prospectoId }: { prospectoId: string }) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [tipo, setTipo] = useState<TipoDocumento>("liquidacion");
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [vista, setVista] = useState<{ nombre: string; mime: string; url: string } | null>(null);

  useEffect(() => {
    let vivo = true;
    void listarDocumentos(prospectoId)
      .then((lista) => {
        if (vivo) setDocumentos(lista);
      })
      .catch((e: Error) => {
        if (vivo) setError(e.message);
      });
    return () => {
      vivo = false;
    };
  }, [prospectoId]);

  async function recibir(archivo: File | undefined) {
    if (!archivo) return;
    setSubiendo(true);
    setError(null);
    try {
      const creado = await subirDocumento(prospectoId, tipo, archivo);
      setDocumentos((lista) => [creado, ...lista]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir");
    } finally {
      setSubiendo(false);
    }
  }

  function soltar(event: DragEvent) {
    event.preventDefault();
    setArrastrando(false);
    void recibir(event.dataTransfer.files[0]);
  }

  async function abrir(documento: Documento) {
    setError(null);
    try {
      const url = await urlDocumento(documento.filePath);
      setVista({ nombre: documento.nombre, mime: documento.mime, url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo abrir");
    }
  }

  async function borrar(documento: Documento) {
    setError(null);
    try {
      await eliminarDocumento(documento);
      setDocumentos((lista) => lista.filter((item) => item.id !== documento.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo borrar");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Tipo
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoDocumento)}
            className="h-8 rounded-lg border bg-background px-2"
          >
            {TIPOS_DOCUMENTO.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </label>
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={soltar}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground",
            arrastrando && "border-proceso bg-proceso/5 text-foreground",
          )}
        >
          <FileUpIcon className="size-5" aria-hidden />
          {subiendo ? "Subiendo…" : "Arrastra el archivo o haz clic"}
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label="Archivo del prospecto"
            disabled={subiendo}
            onChange={(e) => {
              void recibir(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <ul className="flex flex-col gap-2">
          {documentos.map((documento) => (
            <li key={documento.id} className="flex items-center gap-2 text-sm">
              <button type="button" className="min-w-0 flex-1 truncate text-left hover:underline" onClick={() => void abrir(documento)}>
                {documento.nombre}
              </button>
              <span className="shrink-0 text-xs text-muted-foreground">{formatFecha(documento.creadoEn.slice(0, 10))}</span>
              <Button variant="ghost" size="icon-xs" aria-label={`Borrar ${documento.nombre}`} onClick={() => void borrar(documento)}>
                <Trash2Icon />
              </Button>
            </li>
          ))}
          {documentos.length === 0 && !error && <li className="text-sm text-muted-foreground">Sin documentos.</li>}
        </ul>
      </CardContent>
      <VistaPrevia
        abierta={vista !== null}
        nombre={vista?.nombre ?? ""}
        mime={vista?.mime ?? ""}
        url={vista?.url ?? null}
        onCerrar={() => setVista(null)}
      />
    </Card>
  );
}
