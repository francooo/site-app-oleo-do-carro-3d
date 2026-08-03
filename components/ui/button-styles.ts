// min-h-11 (44px) atende o requisito de alvo de toque da seção 5.5 do PRD.
export function buttonClasses(variant: "primary" | "secondary" = "primary") {
  const base =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    primary: "bg-accent text-accent-foreground hover:bg-accent-hover active:bg-accent-active",
    secondary:
      "border border-border bg-surface text-foreground hover:border-accent hover:bg-accent-soft active:bg-accent-soft",
  };
  return `${base} ${variants[variant]}`;
}
