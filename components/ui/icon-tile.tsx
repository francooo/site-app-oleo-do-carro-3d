import type { ReactNode } from "react";

type IconTileProps = {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
};

// Quadrado escuro com contorno cobre que abriga ícones (logo, fluido em
// destaque no painel do mapa, item de lista).
export function IconTile({ children, size = "md", className = "" }: IconTileProps) {
  const sizes = {
    sm: "h-10 w-10 rounded-lg [&>svg]:h-5 [&>svg]:w-5",
    md: "h-12 w-12 rounded-xl [&>svg]:h-6 [&>svg]:w-6",
    lg: "h-16 w-16 rounded-2xl [&>svg]:h-8 [&>svg]:w-8",
  };
  return (
    <span
      className={`border-copper/50 bg-surface-lowest text-accent flex shrink-0 items-center justify-center border shadow-[inset_0_1px_0_rgba(255,220,170,0.06)] ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}
