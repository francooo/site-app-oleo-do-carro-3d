"use client";

import { Car, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/garagem", label: "Garagem", icon: Car },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

// Só mobile (md:hidden) — no desktop a navegação já vive na Sidebar.
// pb-[env(safe-area-inset-bottom)] porque isto é `fixed`, então escapa do
// padding de safe-area que o body já aplica no fluxo normal (PRD 5.5).
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border/30 bg-surface-low pb-[env(safe-area-inset-bottom)] md:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-11 flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
              isActive ? "text-accent-text" : "text-foreground-muted"
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
