"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function VistaPrevia({
  abierta,
  nombre,
  mime,
  url,
  onCerrar,
}: {
  abierta: boolean;
  nombre: string;
  mime: string;
  url: string | null;
  onCerrar: () => void;
}) {
  const imagen = mime.startsWith("image/");
  return (
    <Dialog open={abierta} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="pr-8">{nombre}</DialogTitle>
        </DialogHeader>
        {url && imagen && (
          // La URL firmada de Storage dura dos minutos y no está en los patrones de next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={nombre} className="max-h-[70dvh] w-full object-contain" />
        )}
        {url && mime === "application/pdf" && <iframe title={nombre} src={url} className="h-[70dvh] w-full rounded-lg" />}
        {url && !imagen && mime !== "application/pdf" && (
          <a href={url} className="text-sm underline" target="_blank" rel="noreferrer">
            Descargar
          </a>
        )}
      </DialogContent>
    </Dialog>
  );
}
