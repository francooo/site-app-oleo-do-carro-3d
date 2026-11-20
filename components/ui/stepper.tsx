type StepperProps = {
  total: number;
  /** Índice base 0 do passo atual. */
  current: number;
  className?: string;
};

// Pontos de progresso do tutorial passo a passo (tela 05).
export function StepDots({ total, current, className = "" }: StepperProps) {
  return (
    <ol className={`flex items-center justify-center gap-3 ${className}`} aria-label="Progresso">
      {Array.from({ length: total }, (_, i) => (
        <li
          key={i}
          aria-current={i === current ? "step" : undefined}
          className={`h-3 w-3 rounded-full border transition-all ${
            i === current
              ? "border-accent bg-accent shadow-glow"
              : i < current
                ? "border-accent/70 bg-accent/40"
                : "border-foreground-muted/50"
          }`}
        >
          <span className="sr-only">
            Passo {i + 1} de {total}
            {i === current ? " (atual)" : ""}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Pílula "1 de 4". */
export function StepCounter({ total, current, className = "" }: StepperProps) {
  return (
    <span
      className={`border-copper/60 bg-surface-lowest/85 font-heading text-foreground-strong inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-bold backdrop-blur ${className}`}
    >
      {current + 1} <span className="text-foreground-muted mx-1 font-medium">de</span> {total}
    </span>
  );
}
