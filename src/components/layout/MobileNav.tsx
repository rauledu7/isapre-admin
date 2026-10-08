"use client";

import { MenuIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { Brand } from "./Brand";
import { SidebarNav } from "./SidebarNav";

export function MobileNav() {
  const [abierto, setAbierto] = useState(false);

  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú" />}
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 border-sidebar-border bg-sidebar text-sidebar-foreground [&_[data-slot=sheet-close]]:text-sidebar-foreground"
      >
        <SheetHeader className="px-0">
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <Brand />
        </SheetHeader>
        <div className="px-2">
          <SidebarNav onNavigate={() => setAbierto(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
