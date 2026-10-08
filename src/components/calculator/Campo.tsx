import { useId, type ComponentProps, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CampoProps extends Omit<ComponentProps<typeof Input>, "id"> {
  label: string;
  ayuda?: ReactNode;
  sufijo?: string;
}

export function Campo({ label, ayuda, sufijo, className, ...inputProps }: CampoProps) {
  const id = useId();
  const ayudaId = `${id}-ayuda`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          aria-describedby={ayuda ? ayudaId : undefined}
          className={cn("tabular-nums", sufijo && "pr-10")}
          {...inputProps}
        />
        {sufijo && (
          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-muted-foreground">
            {sufijo}
          </span>
        )}
      </div>
      {ayuda && (
        <p id={ayudaId} className="text-xs text-muted-foreground">
          {ayuda}
        </p>
      )}
    </div>
  );
}
