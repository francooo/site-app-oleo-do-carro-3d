import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Contorno cobre mais forte + brilho ao passar o mouse (cards clicáveis). */
  interactive?: boolean;
};

// Card escuro com cantos arredondados e contorno cobre — componente
// recorrente nº 1 do design system.
export function cardClasses(interactive = false) {
  return `rounded-2xl border border-copper/45 bg-gradient-to-b from-surface/95 to-surface-low/95 shadow-card ${
    interactive
      ? "transition-all hover:border-accent/70 hover:shadow-card-hover active:scale-[0.995]"
      : ""
  }`;
}

export function Card({ interactive = false, className = "", ...props }: CardProps) {
  return <div className={`${cardClasses(interactive)} ${className}`} {...props} />;
}
