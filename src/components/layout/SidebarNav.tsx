"use client";

import {
  CalculatorIcon,
  CalendarIcon,
  CreditCardIcon,
  FolderIcon,
  LayoutDashboardIcon,
  MegaphoneIcon,
  Table2Icon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { permite, type Funcion } from "@/lib/suscripcion";
import { cn } from "@/lib/utils";

import { useNivelPlan } from "./AccesoPlan";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  proximamente?: boolean;
  funcion?: Funcion;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/calendario", label: "Calendario", icon: CalendarIcon },
  { href: "/cotizador", label: "Cotizador Rápido", icon: CalculatorIcon },
  { href: "/prospectos", label: "Prospectos", icon: UsersIcon },
  { href: "/documentos", label: "Documentos", icon: FolderIcon, funcion: "documentos" },
  { href: "/isapres", label: "Isapres", icon: Table2Icon },
  { href: "/google-ads", label: "Google Ads", icon: MegaphoneIcon, funcion: "google_ads" },
  { href: "/suscripcion", label: "Suscripción", icon: CreditCardIcon },
];

interface SidebarNavProps {
  onNavigate?: () => void;
}

export function SidebarNav(props: SidebarNavProps) {
  return (
    <Suspense fallback={<NavLista pathname={null} {...props} />}>
      <SidebarNavActivo {...props} />
    </Suspense>
  );
}

function SidebarNavActivo(props: SidebarNavProps) {
  return <NavLista pathname={usePathname()} {...props} />;
}

function NavLista({ pathname, onNavigate }: SidebarNavProps & { pathname: string | null }) {
  const nivel = useNivelPlan();
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.filter((item) => !item.funcion || (nivel !== null && permite(nivel, item.funcion))).map(({ href, label, icon: Icon, proximamente }) => {
        const activo = href === "/" ? pathname === "/" : (pathname?.startsWith(href) ?? false);
        const clases = cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          activo
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
        );

        if (proximamente) {
          return (
            <span key={href} aria-disabled className={cn(clases, "cursor-not-allowed opacity-50")}>
              <Icon className="size-4" />
              {label}
              <Badge variant="outline" className="ml-auto">
                Pronto
              </Badge>
            </span>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={activo ? "page" : undefined}
            className={clases}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
