"use client";

import { Car, LogOut, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonClasses } from "@/components/ui/button-styles";
import { signOutAction } from "@/lib/auth/actions";

type SidebarProps = {
  user: {
    name?: string | null;
    email?: string | null;
  };
};

const NAV_ITEMS = [
  { href: "/garagem", label: "Garagem", icon: Car },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

// Só desktop (md+) — no mobile a navegação equivalente é a BottomNav
// (components/app-shell/bottom-nav.tsx).
export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const initial = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border/30 bg-surface-low p-4 md:flex">
      <Link
        href="/configuracoes"
        className="mb-6 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent/10"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 font-heading font-semibold text-accent-text">
          {initial}
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-foreground">
            {user.name ?? "Sem nome cadastrado"}
          </span>
          <span className="truncate text-xs text-foreground-muted">{user.email}</span>
        </div>
      </Link>

      <Link href="/veiculos/novo" className={`${buttonClasses("primary")} mb-6 w-full gap-2`}>
        <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        Adicionar veículo
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/10 text-accent-text"
                  : "text-foreground-muted hover:bg-accent/10 hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <form action={signOutAction} className="border-t border-border/30 pt-2">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground-muted transition-colors hover:bg-error/10 hover:text-error"
        >
          <LogOut className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          Sair
        </button>
      </form>
    </aside>
  );
}
