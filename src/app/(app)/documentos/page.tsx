import type { Metadata } from "next";

import { DocumentosView } from "@/components/documentos/DocumentosView";

export const metadata: Metadata = { title: "Documentos · IsapreAssistant" };

export default function DocumentosPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Documentos</h1>
        <p className="text-sm text-muted-foreground">
          Liquidaciones, cédulas, certificados y FUN de tus prospectos.
        </p>
      </div>
      <DocumentosView />
    </div>
  );
}
