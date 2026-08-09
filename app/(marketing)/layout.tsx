import { Gauge } from "lucide-react";
import Link from "next/link";

import { buttonClasses } from "@/components/ui/button-styles";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-50 border-b border-border/30 bg-surface-low/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-2 font-heading text-lg font-bold text-accent-text">
            <Gauge className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
            AutoGuide AI
          </div>
          <nav className="hidden md:flex md:items-center md:gap-8">
            <a
              href="#funcionalidades"
              className="text-sm font-medium text-foreground-muted transition-colors hover:text-accent-text"
            >
              Como funciona
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonClasses("secondary")}>
              Entrar
            </Link>
            <Link href="/signup" className={buttonClasses("primary")}>
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="border-t border-border/30 bg-surface-lowest px-4 py-8 sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
            <Gauge className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            AutoGuide AI
          </div>
          <p className="text-sm text-foreground-muted">
            © {new Date().getFullYear()} AutoGuide AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
