import type { Metadata } from "next";
import { Suspense } from "react";

import { FichaProspecto } from "@/components/crm/FichaProspecto";

export const metadata: Metadata = { title: "Ficha de prospecto · IsapreAssistant" };

export default function FichaProspectoPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando ficha…</p>}>
      <FichaProspecto />
    </Suspense>
  );
}
