import { Suspense } from "react";

import { TOPE_IMPONIBLE_SALUD_UF } from "@/config/isapres";
import { obtenerValorUFOpcional } from "@/lib/indicators/uf";

import { MobileNav } from "./MobileNav";
import { UFIndicator } from "./UFIndicator";
import { UserMenu } from "./UserMenu";

const topeFormatter = new Intl.NumberFormat("es-CL", { minimumFractionDigits: 1 });

async function UFOficial() {
  const uf = await obtenerValorUFOpcional();
  return <UFIndicator ufOficial={uf} />;
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
      <MobileNav />
      <div className="flex-1" />
      <div className="hidden text-right leading-tight sm:block">
        <p className="text-xs text-muted-foreground">Tope imponible</p>
        <p className="text-sm font-medium tabular-nums">
          {topeFormatter.format(TOPE_IMPONIBLE_SALUD_UF)} UF
        </p>
      </div>
      <div className="hidden h-8 w-px bg-border sm:block" />
      <Suspense fallback={<p className="text-xs text-muted-foreground">Obteniendo UF…</p>}>
        <UFOficial />
      </Suspense>
      <div className="h-8 w-px bg-border" />
      <UserMenu />
    </header>
  );
}
