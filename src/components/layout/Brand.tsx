import { HeartPulseIcon } from "lucide-react";

export function Brand() {
  return (
    <div className="flex items-center gap-2 px-3">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <HeartPulseIcon className="size-4" />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold">IsapreAssistant</p>
        <p className="text-xs text-current/70">Copiloto del asesor</p>
      </div>
    </div>
  );
}
