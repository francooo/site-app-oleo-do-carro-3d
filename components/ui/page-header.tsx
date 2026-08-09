import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  /** Omitido nas telas-raiz (ex.: garagem), que não precisam de volta. */
  backHref?: string;
  backLabel?: string;
  /** Slot de ações à direita (ex.: ícone de configurações + botão adicionar
   *  na garagem), pra não duplicar o layout do header em cada página. */
  actions?: ReactNode;
};

// backHref explícito (não router.back()): em PWA standalone o histórico de
// navegação pode não existir — a tela pode ter sido aberta direto, sem
// stack prévio. Um destino fixo por página é determinístico.
//
// Sticky + blur: funciona tanto como top app bar mobile quanto como header
// de página no desktop (onde a navegação principal já vive na sidebar).
//
// Sem "use client": não tem estado nem hooks, então funciona tanto
// importado por Server Components quanto por Client Components.
export function PageHeader({ title, backHref, backLabel = "Voltar", actions }: PageHeaderProps) {
  return (
    <div className="sticky top-0 z-40 mb-6 flex items-center justify-between gap-3 border-b border-border/30 bg-background/95 py-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label={backLabel}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-foreground-muted transition-colors active:bg-accent/10 active:text-accent-text"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </Link>
        ) : null}
        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">{title}</h1>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
