import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/LoginForm";
import { Brand } from "@/components/layout/Brand";
import { LogoMark } from "@/components/layout/LogoMark";
import { PieLegal } from "@/components/layout/PieLegal";
import { MARCA, MARCA_LINEA } from "@/config/marca";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh w-full flex-1 flex-col lg:flex-row">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#0f172a] px-12 py-12 text-white lg:flex lg:w-[46%] lg:max-w-xl">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-16 size-80 rounded-full bg-[#4f46e5]/40 blur-3xl"
        />
        <div className="relative">
          <Brand />
        </div>
        <div className="relative max-w-md">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            El escritorio del asesor de salud.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
            Prospectos, cotizaciones en UF y documentos de cada cliente, en una sola mesa de trabajo.
          </p>
        </div>
        <PieLegal className="relative max-w-sm text-xs leading-relaxed text-slate-400" />
      </section>

      <section className="flex flex-1 flex-col bg-background px-6 py-8">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <LogoMark className="size-10 rounded-lg" />
            <div className="leading-tight">
              <p className="text-base font-semibold tracking-tight">{MARCA}</p>
              <p className="text-sm text-muted-foreground">{MARCA_LINEA}</p>
            </div>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
          </div>
        </div>
        <PieLegal className="mx-auto mt-8 max-w-md text-center text-xs leading-relaxed text-muted-foreground lg:hidden" />
      </section>
    </div>
  );
}
