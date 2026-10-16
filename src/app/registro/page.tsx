import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthMarco } from "@/components/auth/AuthMarco";
import { RegistroForm } from "@/components/auth/RegistroForm";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegistroPage() {
  return (
    <AuthMarco
      titulo="Siete días para probar el escritorio completo."
      texto="Al registrarte partes en prueba. Si ya sabes el plan, lo dejas contratado y el primer cobro espera a que terminen esos días."
    >
      <Suspense>
        <RegistroForm />
      </Suspense>
    </AuthMarco>
  );
}
