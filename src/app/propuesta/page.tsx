import type { Metadata } from "next";
import { Suspense } from "react";

import { VistaPropuesta } from "@/components/propuesta/VistaPropuesta";

export const metadata: Metadata = { title: "Propuesta · IsapreAssistant" };

export default function PropuestaPage() {
  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-8 print:max-w-none print:p-0">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando propuesta…</p>}>
        <VistaPropuesta />
      </Suspense>
    </main>
  );
}
