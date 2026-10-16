import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthMarco } from "@/components/auth/AuthMarco";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <AuthMarco
      titulo="El escritorio del asesor de salud."
      texto="Prospectos, cotizaciones en UF y documentos de cada cliente, en una sola mesa de trabajo."
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthMarco>
  );
}
