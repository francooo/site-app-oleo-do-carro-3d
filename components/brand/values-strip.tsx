import { Gauge, Leaf, ShieldCheck, Sprout } from "lucide-react";

const VALUES = [
  { icon: Leaf, label: "Mais conhecimento" },
  { icon: ShieldCheck, label: "Mais segurança" },
  { icon: Gauge, label: "Mais economia" },
  { icon: Sprout, label: "Um futuro mais longe" },
] as const;

// Faixa de valores sobre madeira clara (rodapé das telas de login).
export function ValuesStrip({ className = "" }: { className?: string }) {
  return (
    <ul
      className={`bg-wood-texture text-wood-foreground grid grid-cols-4 gap-2 px-4 py-5 text-center ${className}`}
    >
      {VALUES.map(({ icon: Icon, label }) => (
        <li key={label} className="flex flex-col items-center gap-1.5">
          <Icon className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
          <span className="text-[0.625rem] leading-tight font-bold tracking-wide uppercase sm:text-xs">
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}
