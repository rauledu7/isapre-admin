"use client";

import { CheckIcon, CopyIcon, FileTextIcon, MessageCircleIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { mensajeWhatsApp, urlWhatsApp, type Propuesta } from "@/lib/propuesta";
import { usePerfilStore } from "@/store/perfilStore";

export type PropuestaSinAsesor = Omit<Propuesta, "asesor">;

interface AccionesPropuestaProps {
  propuesta: PropuestaSinAsesor;
  /** Teléfono del prospecto ("+56…"); sin él WhatsApp pide elegir el contacto. */
  telefono: string | null;
  hrefPdf?: string;
  size?: "sm" | "default";
}

export function AccionesPropuesta({ propuesta, telefono, hrefPdf, size = "default" }: AccionesPropuestaProps) {
  const asesor = usePerfilStore((s) => s.perfil);
  const cargarPerfil = usePerfilStore((s) => s.cargar);
  const [copiado, setCopiado] = useState<"ok" | "error" | null>(null);

  useEffect(() => {
    void cargarPerfil();
  }, [cargarPerfil]);

  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(null), 2000);
    return () => clearTimeout(t);
  }, [copiado]);

  const texto = mensajeWhatsApp({ ...propuesta, asesor });

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado("ok");
    } catch {
      setCopiado("error");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size={size}
        nativeButton={false}
        render={<a href={urlWhatsApp(texto, telefono)} target="_blank" rel="noopener noreferrer" />}
      >
        <MessageCircleIcon /> WhatsApp
      </Button>
      <Button size={size} variant="outline" onClick={copiar}>
        {copiado === "ok" ? <CheckIcon /> : <CopyIcon />}
        {copiado === "ok" ? "Copiado" : copiado === "error" ? "No se pudo copiar" : "Copiar mensaje"}
      </Button>
      {hrefPdf && (
        <Button size={size} variant="outline" nativeButton={false} render={<Link href={hrefPdf} />}>
          <FileTextIcon /> PDF
        </Button>
      )}
    </div>
  );
}
