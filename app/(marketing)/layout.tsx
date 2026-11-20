import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/button-styles";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-copper/20 bg-background/90 sticky top-0 z-50 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-8">
          <Link href="/" aria-label="Fluido Fácil — início">
            <Logo markClassName="h-9 w-9" />
          </Link>
          <nav className="hidden md:flex md:items-center md:gap-8">
            <a
              href="#funcionalidades"
              className="text-foreground-muted hover:text-accent-text text-sm font-medium transition-colors"
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

      <footer className="bg-wood-texture text-wood-foreground px-4 py-8 sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 text-center md:flex-row md:text-left">
          <p className="font-heading text-sm font-bold">Fluido Fácil — cuide bem do seu carro</p>
          <p className="max-w-xl text-xs font-medium">
            Conteúdo educativo. Não substitui o manual do proprietário nem a orientação de um
            profissional qualificado. © {new Date().getFullYear()} Fluido Fácil.
          </p>
        </div>
      </footer>
    </div>
  );
}
