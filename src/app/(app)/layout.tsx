import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </>
  );
}
