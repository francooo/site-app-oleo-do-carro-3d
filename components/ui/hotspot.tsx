"use client";

import type { ReactNode } from "react";

type HotspotProps = {
  /** Posição em % sobre a imagem do cofre (engine_layout_hotspots.x/y). */
  x: number;
  y: number;
  label: string;
  active?: boolean;
  onSelect?: () => void;
  /** Rótulo visível no desktop (com este ícone). Sem ele, só o ponto. */
  icon?: ReactNode;
  /** Desenho dentro do ponto (planta 2D: ícone do fluido no lugar do miolo). */
  glyph?: ReactNode;
};

// Ponto de interação âmbar com brilho (componente recorrente do design
// system). É um <button> real: navegável por teclado e com nome acessível.
// A lista textual equivalente é renderizada fora do diagrama (critério §5:
// "todo ponto 3D precisa ter uma alternativa textual em lista").
export function Hotspot({ x, y, label, active = false, onSelect, icon, glyph }: HotspotProps) {
  // Ponto perto da borda: o rótulo cresce para dentro da imagem em vez de
  // ficar centralizado e ser cortado ("mpador de para-brisa").
  const align =
    x < 25
      ? "left-1 origin-top-left"
      : x > 75
        ? "right-1 origin-top-right"
        : "left-1/2 -translate-x-1/2";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={label}
      aria-pressed={active}
      style={{ left: `${x}%`, top: `${y}%` }}
      className="group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center p-2"
    >
      <span
        aria-hidden="true"
        className={`bg-accent/25 absolute h-9 w-9 rounded-full ${active ? "animate-ping" : "opacity-0 group-hover:opacity-100"}`}
      />
      <span
        aria-hidden="true"
        className={`border-accent shadow-glow relative flex items-center justify-center rounded-full border-2 transition-transform group-hover:scale-110 ${
          glyph ? "bg-surface-lowest h-9 w-9" : "bg-surface-lowest/70 h-6 w-6"
        } ${active ? "scale-125" : ""}`}
      >
        {glyph ?? <span className="h-2.5 w-2.5 rounded-full bg-[#fff1d6]" />}
      </span>
      {icon ? (
        <span
          aria-hidden="true"
          className={`text-foreground-strong pointer-events-none absolute top-full mt-1 hidden items-center gap-1.5 rounded-lg border bg-[#0b0a09]/95 px-3 py-1.5 text-sm font-semibold whitespace-nowrap shadow-[0_4px_16px_rgba(0,0,0,0.7)] backdrop-blur-md sm:flex ${align} ${
            active ? "border-accent" : "border-copper/70"
          }`}
        >
          {icon}
          {label}
        </span>
      ) : null}
    </button>
  );
}
