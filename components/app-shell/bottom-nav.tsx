"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavItemActive, NAV_ITEMS } from "@/components/app-shell/nav-items";

// Só mobile (md:hidden) — no desktop a navegação vive na Sidebar.
// Barra inferior sobre madeira clara (componente recorrente do design
// system), item ativo com texto mais forte + sublinhado âmbar — o estado
// não depende só de cor.
// pb-[env(safe-area-inset-bottom)] porque isto é `fixed`, então escapa do
// padding de safe-area que o body já aplica no fluxo normal (PRD 5.5).
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="bg-wood-texture fixed inset-x-0 bottom-0 z-40 flex rounded-t-2xl border-t border-[#f3d3a6]/60 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.45)] md:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = isNavItemActive(item, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`relative flex min-h-16 flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors ${
              isActive ? "font-extrabold text-[#1a0f05]" : "text-wood-foreground/75 font-semibold"
            }`}
          >
            <Icon className="h-6 w-6" strokeWidth={isActive ? 2.6 : 2} aria-hidden="true" />
            {item.label}
            {isActive ? (
              <span
                aria-hidden="true"
                className="absolute bottom-1.5 h-1 w-10 rounded-full bg-[#b5651d] shadow-[0_0_8px_rgba(240,166,74,0.8)]"
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
