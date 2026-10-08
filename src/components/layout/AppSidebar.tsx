import { Brand } from "./Brand";
import { SidebarNav } from "./SidebarNav";

export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r bg-sidebar py-4 md:flex">
      <Brand />
      <div className="px-2">
        <SidebarNav />
      </div>
    </aside>
  );
}
