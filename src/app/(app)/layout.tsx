import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { PieLegal } from "@/components/layout/PieLegal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 p-4 md:p-6">{children}</main>
        <PieLegal className="px-4 pb-4 text-xs leading-relaxed text-muted-foreground md:px-6" />
      </div>
    </>
  );
}
