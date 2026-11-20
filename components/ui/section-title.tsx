import type { ReactNode } from "react";

type SectionTitleProps = {
  children: ReactNode;
  action?: ReactNode;
  as?: "h2" | "h3";
  className?: string;
};

// Título de seção âmbar ("Como está o seu carro?", "Continue aprendendo").
export function SectionTitle({
  children,
  action,
  as: Tag = "h2",
  className = "",
}: SectionTitleProps) {
  return (
    <div className={`mb-3 flex items-end justify-between gap-3 ${className}`}>
      <Tag className="font-heading text-xl font-bold tracking-tight md:text-2xl">
        <span className="text-gradient-amber">{children}</span>
      </Tag>
      {action}
    </div>
  );
}

type HighlightTitleProps = {
  /** Parte em creme/branco. */
  lead: string;
  /** Palavra de destaque em âmbar ("Mapa de *fluidos*"). */
  highlight: string;
  subtitle?: string;
  className?: string;
};

// Título de página no padrão dos mockups: parte clara + destaque âmbar.
export function HighlightTitle({ lead, highlight, subtitle, className = "" }: HighlightTitleProps) {
  return (
    <div className={className}>
      <h1 className="font-heading text-headline-lg-mobile md:text-headline-lg tracking-tight">
        {lead} <span className="text-gradient-amber">{highlight}</span>
      </h1>
      {subtitle ? <p className="text-body-md text-foreground-muted mt-1">{subtitle}</p> : null}
    </div>
  );
}
