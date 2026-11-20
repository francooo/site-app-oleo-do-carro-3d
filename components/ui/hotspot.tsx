"use client";

import type { ReactNode } from "react";

type HotspotProps = {
  /** Posição em % sobre a imagem do cofre (engine_layout_hotspots.x/y). */
  x: number;
  y: number;
  label: string;
  active?: boolean;
  onSelect?: () => void;
  icon?: ReactNode;
};

// Ponto de interação âmbar com brilho (componente recorrente do design
// system). É um <button> real: navegável por teclado e com nome acessível.
// A lista textual equivalente é renderizada fora do diagrama (critério §5:
// "todo ponto 3D precisa ter uma alternativa textual em lista").
export function Hotspot({ x, y, label, active = false, onSelect, icon }: HotspotProps) {
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
        className={`border-accent bg-surface-lowest/70 shadow-glow relative flex h-6 w-6 items-center justify-center rounded-full border-2 transition-transform group-hover:scale-110 ${
          active ? "scale-125" : ""
        }`}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-[#fff1d6]" />
      </span>
      {icon ? (
        <span
          aria-hidden="true"
          className={`border-copper/60 bg-surface-lowest/90 text-foreground-strong pointer-events-none absolute left-1/2 mt-16 hidden -translate-x-1/2 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap backdrop-blur sm:flex ${
            active ? "border-accent" : ""
          }`}
        >
          {icon}
          {label}
        </span>
      ) : null}
    </button>
  );
}
