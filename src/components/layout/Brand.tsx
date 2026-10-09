import { MARCA, MARCA_LINEA } from "@/config/marca";

import { LogoMark } from "./LogoMark";

export function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-3">
      <LogoMark className="size-8 shrink-0 rounded-lg" />
      <div className="min-w-0 leading-tight">
        <p className="text-sm font-semibold tracking-tight">{MARCA}</p>
        <p className="text-xs text-current/70">{MARCA_LINEA}</p>
      </div>
    </div>
  );
}
