import type { Metadata } from "next";

import { Brand } from "@/components/layout/Brand";
import { PieLegal } from "@/components/layout/PieLegal";
import { Button } from "@/components/ui/button";
import { MARCA, MARCA_DESCRIPCION } from "@/config/marca";
import { hostsConfig } from "@/lib/hosts";

export const metadata: Metadata = { title: { absolute: MARCA }, description: MARCA_DESCRIPCION };

const PUNTOS = [
  { titulo: "Cotizador en UF", texto: "Precio final con el 7% legal, factores y GES, listo para la reunión." },
  { titulo: "Prospectos", texto: "Embudo, calendario y seguimiento de cada cliente en un solo lugar." },
  { titulo: "Prueba de 7 días", texto: "El asesor entra, prueba el escritorio completo y elige su plan." },
];

export default function InicioPage() {
  const { asesores } = hostsConfig();
  const ingreso = asesores ? `https://${asesores}/login` : "/login";

  return (
    <div className="flex min-h-dvh w-full flex-1 flex-col bg-background">
      <header className="flex items-center px-6 py-4">
        <Brand />
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 px-6 py-16">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-semibold tracking-tight text-balance">El escritorio del asesor de salud.</h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            Velora ordena la cotización, los prospectos y los documentos de cada cliente. Pensado para quien vende planes de Isapre.
          </p>
          <div>
            <Button nativeButton={false} render={<a href={ingreso} />}>
              Entrar
            </Button>
          </div>
        </div>
        <ul className="grid gap-6 sm:grid-cols-3">
          {PUNTOS.map((punto) => (
            <li key={punto.titulo} className="flex flex-col gap-1">
              <p className="text-sm font-medium">{punto.titulo}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{punto.texto}</p>
            </li>
          ))}
        </ul>
      </main>
      <PieLegal className="px-6 pb-6 text-xs leading-relaxed text-muted-foreground" />
    </div>
  );
}
