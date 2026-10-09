import type { Metadata } from "next";

import { TarifariosAsesor } from "@/components/layout/TarifariosAsesor";

export const metadata: Metadata = { title: "Isapres" };

export default function IsapresPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Isapres</h1>
        <p className="text-sm text-muted-foreground">
          El GES de cada Isapre y, si lo tienes, su tarifario. El cotizador usa estos valores. El GES está bloqueado: ábrelo para corregirlo.
        </p>
      </div>
      <TarifariosAsesor />
    </div>
  );
}
