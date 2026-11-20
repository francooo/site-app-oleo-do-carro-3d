import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { type ButtonVariant, buttonClasses } from "@/components/ui/button-styles";

type CtaLinkProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  /** Ícone à esquerda do texto (ex.: Plus em "Adicionar carro"). */
  icon?: LucideIcon;
  /** Seta de avanço à direita — padrão dos CTAs do design system. */
  arrow?: boolean;
  className?: string;
};

// CTA cheio dos mockups: texto centralizado e seta presa à borda direita.
export function CtaLink({
  href,
  children,
  variant = "primary",
  icon: Icon,
  arrow = true,
  className = "",
}: CtaLinkProps) {
  return (
    <Link href={href} className={`${buttonClasses(variant, "lg")} w-full ${className}`}>
      {Icon ? <Icon className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" /> : null}
      <span>{children}</span>
      {arrow ? (
        <ArrowRight
          className="absolute right-5 h-5 w-5 transition-transform group-hover:translate-x-0.5"
          strokeWidth={2.4}
          aria-hidden="true"
        />
      ) : null}
    </Link>
  );
}
