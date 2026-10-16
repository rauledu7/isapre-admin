import type { Metadata } from "next";

import { AdminPanel } from "@/components/admin/AdminPanel";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Panel de administración</h1>
        <p className="text-sm text-muted-foreground">Asesores, suscripciones e ingresos de Velora.</p>
      </div>
      <AdminPanel />
    </div>
  );
}
