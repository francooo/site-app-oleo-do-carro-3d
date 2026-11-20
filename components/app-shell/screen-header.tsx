import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";

type ScreenHeaderProps = {
  /** Parte em creme do título ("Cadastrar"). */
  lead?: string;
  /** Destaque em âmbar ("veículo"). */
  highlight: string;
  subtitle?: string;
  /** Destino fixo do voltar — em PWA standalone pode não haver histórico. */
  backHref?: string;
  backLabel?: string;
  /** Ação à direita (ex.: sino de lembretes no Início). */
  action?: ReactNode;
};

// Cabeçalho das telas do app no padrão dos mockups 9:16: logo no topo (só no
// celular — no desktop ele já está na sidebar), voltar redondo com contorno
// cobre e título "creme + âmbar".
export function ScreenHeader({
  lead,
  highlight,
  subtitle,
  backHref,
  backLabel = "Voltar",
  action,
}: ScreenHeaderProps) {
  return (
    <header className="mb-6 md:mb-8">
      <div className="mb-5 flex justify-center md:hidden">
        <Link href="/inicio" aria-label="Fluido Fácil — início">
          <Logo markClassName="h-12 w-12" />
        </Link>
      </div>

      <div className="relative flex min-h-12 items-center justify-center md:justify-start md:gap-4">
        {backHref ? (
          <Link
            href={backHref}
            aria-label={backLabel}
            className="border-copper/70 bg-surface-lowest/80 text-accent hover:border-accent hover:bg-accent/10 absolute left-0 flex h-12 w-12 items-center justify-center rounded-full border transition-colors md:static"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2.4} aria-hidden="true" />
          </Link>
        ) : null}

        <div className="px-14 text-center md:px-0 md:text-left">
          <h1 className="font-heading text-[1.75rem] leading-tight font-extrabold tracking-tight md:text-4xl">
            {lead ? <span className="text-foreground-strong">{lead} </span> : null}
            <span className="text-gradient-amber">{highlight}</span>
          </h1>
          {subtitle ? (
            <p className="text-foreground-muted mt-1 text-sm md:text-base">{subtitle}</p>
          ) : null}
        </div>

        {action ? <div className="absolute right-0 md:static md:ml-auto">{action}</div> : null}
      </div>
    </header>
  );
}
