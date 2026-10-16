import type { Metadata } from "next";

import { SuscripcionPanel } from "@/components/layout/SuscripcionPanel";

export const metadata: Metadata = { title: "Suscripción" };

export default function SuscripcionPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Suscripción</h1>
        <p className="text-sm text-muted-foreground">Tu plan de Velora y el estado de tu prueba gratis.</p>
      </div>
      <SuscripcionPanel />
    </div>
  );
}
