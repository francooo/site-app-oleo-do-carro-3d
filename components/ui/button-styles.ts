// Botões do Fluido Fácil:
// - primary: âmbar com texto escuro (CTA único e dominante por tela — §5 UX)
// - secondary: escuro com contorno âmbar
// - ghost: só texto, para ações terciárias ("Sair do tutorial")
// min-h-11 (44px) atende o alvo de toque da seção 5.5 do PRD; size "lg" é o
// CTA cheio dos mockups.
export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg";

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  // "group": habilita group-hover: em ícones filhos (ex.: seta que desliza).
  const base =
    "group relative inline-flex items-center justify-center gap-2 font-semibold transition-all disabled:pointer-events-none disabled:opacity-50";
  const sizes = {
    md: "min-h-11 rounded-lg px-4 py-2.5 text-sm",
    lg: "min-h-14 rounded-xl px-6 py-3.5 font-heading text-base md:text-lg",
  };
  const variants = {
    primary:
      "bg-gradient-to-b from-accent-hover via-accent to-accent-active text-accent-foreground shadow-[inset_0_1px_0_rgba(255,240,210,0.6),0_6px_18px_rgba(240,166,74,0.25)] hover:brightness-105 active:brightness-95",
    secondary:
      "border border-accent/70 bg-surface-lowest/70 text-accent-text hover:bg-accent/10 active:bg-accent/15",
    ghost: "text-foreground-muted underline-offset-4 hover:text-foreground hover:underline",
  };
  return `${base} ${sizes[size]} ${variants[variant]}`;
}
