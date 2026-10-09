import type { Metadata } from "next";

import { GoogleAdsForm } from "@/components/configuracion/GoogleAdsForm";

export const metadata: Metadata = { title: "Google Ads" };

export default function GoogleAdsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Google Ads</h1>
        <p className="text-sm text-muted-foreground">
          Conecta tu cuenta para ver clics y gasto, y para informar la UF cuando cierras un contrato.
        </p>
      </div>
      <GoogleAdsForm />
    </div>
  );
}
