"use client";

import { FileUpIcon } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { filasDesdeArchivo } from "@/lib/hoja";
import { revisarImportacion, type InformeImportacion } from "@/lib/importacion";
import { cn } from "@/lib/utils";
import { useProspectosStore } from "@/store/prospectosStore";

const EXTENSIONES = [".csv", ".xls", ".xlsx"];

function extensionValida(nombre: string): boolean {
  const lower = nombre.toLowerCase();
  return EXTENSIONES.some((ext) => lower.endsWith(ext));
}

export function ImportarDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (abierto: boolean) => void }) {
  const etapas = useProspectosStore((s) => s.etapas);
  const prospectos = useProspectosStore((s) => s.prospectos);
  const importar = useProspectosStore((s) => s.importarProspectos);
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [informe, setInforme] = useState<Extract<InformeImportacion, { ok: true }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function cerrar(abierto: boolean) {
    if (!abierto) {
      setInforme(null);
      setError(null);
      setGuardando(false);
      setArrastrando(false);
    }
    onOpenChange(abierto);
  }

  async function leer(file: File) {
    setError(null);
    setInforme(null);
    if (!extensionValida(file.name)) {
      setError("Usa un archivo CSV, XLS o XLSX.");
      return;
    }
    try {
      const filas = filasDesdeArchivo(await file.arrayBuffer());
      const resultado = revisarImportacion(filas, etapas, new Set(prospectos.map((p) => p.rut)));
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setInforme(resultado);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer el archivo");
    }
  }

  function soltar(event: DragEvent) {
    event.preventDefault();
    setArrastrando(false);
    const file = event.dataTransfer.files[0];
    if (file) void leer(file);
  }

  async function confirmar() {
    if (!informe || informe.listas.length === 0) return;
    setGuardando(true);
    setError(null);
    try {
      await importar(informe.listas.map((fila) => fila.datos));
      cerrar(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron importar");
      setGuardando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar prospectos</DialogTitle>
          <DialogDescription>
            CSV o Excel con Nombre, RUT, Teléfono, Email, Renta imponible, Isapre actual, Cargas y Etapa inicial.
            Las filas incompletas o ilegibles se omiten.
          </DialogDescription>
        </DialogHeader>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={soltar}
          className={cn(
            "flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground",
            arrastrando && "border-proceso bg-proceso/5 text-foreground",
          )}
        >
          <FileUpIcon className="size-5" aria-hidden />
          Arrastra el archivo o haz clic para elegirlo
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xls,.xlsx,text/csv"
          className="sr-only"
          aria-label="Archivo de prospectos"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void leer(file);
            event.target.value = "";
          }}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        {informe && (
          <div className="flex max-h-64 flex-col gap-3 overflow-y-auto text-sm">
            <p>
              {informe.listas.length} listos para importar
              {informe.omitidas.length > 0 && `, ${informe.omitidas.length} se omiten`}
            </p>
            {informe.omitidas.length > 0 && (
              <ul className="flex flex-col gap-1 text-alerta">
                {informe.omitidas.map((fila) => (
                  <li key={fila.fila}>
                    Fila {fila.fila}: {fila.motivo}
                  </li>
                ))}
              </ul>
            )}
            {informe.listas.length > 0 && (
              <ul className="flex flex-col gap-1 text-muted-foreground">
                {informe.listas.map((fila) => (
                  <li key={fila.fila}>
                    Fila {fila.fila}: {fila.datos.nombre}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => cerrar(false)} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={() => void confirmar()} disabled={!informe || informe.listas.length === 0 || guardando}>
            {guardando ? "Importando…" : `Importar ${informe?.listas.length ?? 0}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
