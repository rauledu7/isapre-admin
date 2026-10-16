import type { Metadata } from "next";

import { FacturacionPanel } from "@/components/layout/FacturacionPanel";

export const metadata: Metadata = { title: "Facturación" };

export default function FacturacionPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Facturación</h1>
        <p className="text-sm text-muted-foreground">Estado de tu suscripción y pagos procesados por Mercado Pago.</p>
      </div>
      <FacturacionPanel />
    </div>
  );
}
