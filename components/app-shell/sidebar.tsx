"use client";

import { LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavItemActive, NAV_ITEMS } from "@/components/app-shell/nav-items";
import { Logo } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/button-styles";
import { signOutAction } from "@/lib/auth/actions";

type SidebarProps = {
  user: {
    name?: string | null;
    email?: string | null;
  };
};

// Só desktop (md+) — no mobile a navegação equivalente é a BottomNav
// (components/app-shell/bottom-nav.tsx). Mesmos itens (nav-items.ts).
export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const initial = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();

  return (
    <aside className="border-copper/25 bg-surface-lowest/95 fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r md:flex">
      <div className="p-5 pb-4">
        <Link href="/garagem" aria-label="Fluido Fácil — garagem">
          <Logo markClassName="h-10 w-10" tagline="Cuide bem do seu carro" />
        </Link>
      </div>

      <div className="px-4">
        <Link href="/veiculos/novo" className={`${buttonClasses("primary")} mb-6 w-full`}>
          <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
          Adicionar carro
        </Link>
      </div>

      <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-1 px-4">
        {NAV_ITEMS.map((item) => {
          const isActive = isNavItemActive(item, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "border-copper/50 bg-accent/10 text-accent-text font-bold"
                  : "text-foreground-muted hover:bg-accent/5 hover:text-foreground border-transparent font-medium"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="bg-wood-texture text-wood-foreground mt-4 flex items-center gap-3 px-4 py-3">
        <div className="border-wood-foreground/40 font-heading flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-[#f3dcb8] text-sm font-bold">
          {initial}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-bold">{user.name ?? "Sem nome cadastrado"}</span>
          <span className="truncate text-xs font-medium opacity-80">{user.email}</span>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            aria-label="Sair"
            title="Sair"
            className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-black/10"
          >
            <LogOut className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </button>
        </form>
      </div>
    </aside>
  );
}
