import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type PageHeaderProps = {
  title: string;
  backHref: string;
  backLabel?: string;
};

// backHref explícito (não router.back()): em PWA standalone o histórico de
// navegação pode não existir — a tela pode ter sido aberta direto, sem
// stack prévio. Um destino fixo por página é determinístico.
//
// Sem "use client": não tem estado nem hooks, então funciona tanto
// importado por Server Components quanto por Client Components.
export function PageHeader({ title, backHref, backLabel = "Voltar" }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href={backHref}
        aria-label={backLabel}
        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-foreground-muted transition-colors active:bg-accent-soft active:text-accent-text"
      >
        <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
      </Link>
      <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">{title}</h1>
    </div>
  );
}
