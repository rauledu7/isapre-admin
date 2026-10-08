import type { Metadata } from "next";

import { CalendarioView } from "@/components/calendario/CalendarioView";

export const metadata: Metadata = { title: "Calendario · IsapreAssistant" };

export default function CalendarioPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Calendario</h1>
        <p className="text-sm text-muted-foreground">
          Seguimientos según el próximo contacto de cada prospecto.
        </p>
      </div>
      <CalendarioView />
    </div>
  );
}
