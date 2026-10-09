import type { Metadata } from "next";
import { Suspense } from "react";

import { UFOficial } from "@/components/layout/UFOficial";
import { VistaPropuesta } from "@/components/propuesta/VistaPropuesta";

export const metadata: Metadata = { title: "Propuesta" };

export default function PropuestaPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 sm:p-8 print:max-w-none print:p-0">
      <div className="flex justify-end print:hidden">
        <Suspense fallback={<p className="text-xs text-muted-foreground">Obteniendo UF…</p>}>
          <UFOficial />
        </Suspense>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando propuesta…</p>}>
        <VistaPropuesta />
      </Suspense>
    </main>
  );
}
