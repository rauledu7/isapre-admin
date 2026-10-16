import type { Metadata } from "next";
import { Fraunces } from "next/font/google";

import { Landing } from "@/components/landing/Landing";

const display = Fraunces({ subsets: ["latin"], weight: ["500", "600"] });

export const metadata: Metadata = {
  title: { absolute: "Velora" },
  description: "Escritorio para asesores de Isapre. Cotizador en UF, agenda y metas. Prueba de 7 días.",
};

export default function InicioPage() {
  return <Landing display={display.className} />;
}
