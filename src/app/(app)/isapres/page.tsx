import type { Metadata } from "next";

import { TarifariosAsesor } from "@/components/layout/TarifariosAsesor";

export const metadata: Metadata = { title: "Isapres" };

export default function IsapresPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Isapres</h1>
        <p className="text-sm text-muted-foreground">
          El GES de cada Isapre y su tarifario. Si Velora ya cargó uno, lo ves aquí y puedes reemplazarlo o quitarlo: el cambio queda solo en tu cuenta. Banmédica y el resto se cargan en PDF. Nueva Masvida, en Excel. El GES está bloqueado: ábrelo para corregirlo.
        </p>
      </div>
      <TarifariosAsesor />
    </div>
  );
}
