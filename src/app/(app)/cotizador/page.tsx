import type { Metadata } from "next";

import { Cotizador } from "@/components/calculator/Cotizador";

export const metadata: Metadata = { title: "Cotizador Rápido" };

export default function CotizadorPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Cotizador Rápido</h1>
        <p className="text-sm text-muted-foreground">
          Calcula el 7% legal del cliente en UF y compáralo con el plan actual y las alternativas.
        </p>
      </div>
      <Cotizador />
    </div>
  );
}
