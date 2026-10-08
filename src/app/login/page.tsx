import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/LoginForm";
import { Brand } from "@/components/layout/Brand";

export const metadata: Metadata = { title: "Ingresar · IsapreAssistant" };

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-muted/40 p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Brand />
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
