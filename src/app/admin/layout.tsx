import { AdminBarra } from "@/components/admin/AdminBarra";
import { PieLegal } from "@/components/layout/PieLegal";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-1 flex-col bg-background">
      <AdminBarra />
      <main className="flex-1 p-4 md:p-6">{children}</main>
      <PieLegal className="px-4 pb-4 text-xs leading-relaxed text-muted-foreground md:px-6" />
    </div>
  );
}
