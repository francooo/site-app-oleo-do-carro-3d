// min-h-11 (44px) atende o requisito de alvo de toque da seção 5.5 do PRD.
export function buttonClasses(variant: "primary" | "secondary" = "primary") {
  const base =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-opacity active:opacity-70 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    primary: "bg-foreground text-background",
    secondary: "border border-zinc-300 dark:border-zinc-700",
  };
  return `${base} ${variants[variant]}`;
}
