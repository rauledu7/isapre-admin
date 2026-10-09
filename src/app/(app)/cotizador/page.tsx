import type { Metadata } from "next";

import { Cotizador } from "@/components/calculator/Cotizador";

export const metadata: Metadata = { title: "Cotizador Rápido" };

export default function CotizadorPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <Cotizador />
    </div>
  );
}
