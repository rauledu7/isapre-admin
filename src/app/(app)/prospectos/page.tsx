import type { Metadata } from "next";

import { ProspectosView } from "@/components/crm/ProspectosView";

export const metadata: Metadata = { title: "Prospectos · IsapreAssistant" };

export default function ProspectosPage() {
  return (
    <div className="mx-auto flex max-w-[110rem] flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Prospectos</h1>
        <p className="text-sm text-muted-foreground">
          Embudo comercial: arrastra las tarjetas entre etapas o cámbialas desde la lista.
        </p>
      </div>
      <ProspectosView />
    </div>
  );
}
