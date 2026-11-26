import type { ReactNode } from "react";

import type { BayItem } from "@/lib/domain/bay-positions";

// Planta 2D do cofre gerada da ficha de posições (lib/domain/bay-model.ts):
// vista de frente achatada, painel em cima e para-choque embaixo. É o mapa
// dos carros sem foto curada e o plano B sem WebGL. Os pontos clicáveis
// (Hotspot) entram como children, nas mesmas coordenadas em %.

export type PlanData = {
  title: string;
  engine: { left: number; top: number; width: number; height: number };
  parts: { item: BayItem; label: string; left: number; top: number }[];
};

// Caixa do SVG = PLAN_ASPECT (10:7): x em % direto, y em % × 0,7.
const H = 70;
const y = (topPct: number) => (topPct * H) / 100;

const PART_SHAPE: Partial<Record<BayItem, { w: number; h: number; label?: boolean }>> = {
  battery: { w: 12, h: 8, label: true },
  air_filter: { w: 13, h: 9, label: true },
  fuse_box: { w: 10, h: 7, label: true },
  battery_remote_terminal: { w: 3.5, h: 3 },
};

export function EngineBayPlan({ plan, children }: { plan: PlanData; children?: ReactNode }) {
  const e = plan.engine;
  return (
    <div
      className="border-copper/40 relative w-full overflow-hidden rounded-[1.75rem] border bg-[#11100f]"
      style={{ aspectRatio: "10 / 7" }}
    >
      <svg
        viewBox={`0 0 100 ${H}`}
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={`Planta do ${plan.title.replace(/^Cofre do /, "cofre do ")}, vista de frente com o capô aberto`}
      >
        <rect
          x="3"
          y="3"
          width="94"
          height="64"
          rx="5"
          fill="#1a1715"
          stroke="#7a5a3a"
          strokeWidth="0.4"
        />
        {/* Painel (fundo do cofre) e para-choque (frente). */}
        <rect x="3" y="3" width="94" height="6.5" rx="3" fill="#221e1b" />
        <rect x="3" y="60.5" width="94" height="6.5" rx="3" fill="#221e1b" />
        <text
          x="50"
          y="7.4"
          textAnchor="middle"
          className="fill-[#a59c92]"
          fontSize="2.6"
          letterSpacing="0.3"
        >
          PAINEL · PARA-BRISA
        </text>
        <text
          x="50"
          y="65"
          textAnchor="middle"
          className="fill-[#a59c92]"
          fontSize="2.6"
          letterSpacing="0.3"
        >
          FRENTE · PARA-CHOQUE
        </text>
        <text
          x="5.6"
          y="35"
          textAnchor="middle"
          className="fill-[#7d746b]"
          fontSize="2.3"
          letterSpacing="0.3"
          transform="rotate(-90 5.6 35)"
        >
          LADO DO PASSAGEIRO
        </text>
        <text
          x="94.4"
          y="35"
          textAnchor="middle"
          className="fill-[#7d746b]"
          fontSize="2.3"
          letterSpacing="0.3"
          transform="rotate(90 94.4 35)"
        >
          LADO DO MOTORISTA
        </text>

        {/* Motor */}
        <g>
          <rect
            x={e.left - e.width / 2}
            y={y(e.top) - y(e.height) / 2}
            width={e.width}
            height={y(e.height)}
            rx="3"
            fill="#2a2623"
            stroke="#4a4643"
            strokeWidth="0.4"
          />
          <rect
            x={e.left - e.width / 2 + 3}
            y={y(e.top) - y(e.height) / 2 + 2.5}
            width={e.width - 6}
            height={y(e.height) - 5}
            rx="2"
            fill="#1f1c1a"
          />
          <text
            x={e.left - e.width / 2 + 2}
            y={y(e.top) - y(e.height) / 2 - 1.2}
            className="fill-[#7d746b]"
            fontSize="2.3"
            letterSpacing="0.2"
          >
            MOTOR
          </text>
        </g>

        {plan.parts.map((p) => {
          const cy = y(p.top);
          if (p.item === "oil_cap") {
            return (
              <g key={p.item}>
                <circle
                  cx={p.left}
                  cy={cy}
                  r="1.8"
                  fill="#d9a21b"
                  stroke="#11100f"
                  strokeWidth="0.4"
                >
                  {/* Sem texto: fica colada à vareta; o tutorial explica. */}
                  <title>{p.label}</title>
                </circle>
              </g>
            );
          }
          const s = PART_SHAPE[p.item];
          if (!s) return null;
          return (
            <g key={p.item}>
              <rect
                x={p.left - s.w / 2}
                y={cy - s.h / 2}
                width={s.w}
                height={s.h}
                rx="1.4"
                fill={p.item === "battery_remote_terminal" ? "#7a2a22" : "#242120"}
                stroke="#4a4643"
                strokeWidth="0.35"
              />
              {s.label ? (
                <text
                  x={p.left}
                  y={cy + 0.9}
                  textAnchor="middle"
                  className="fill-[#a59c92]"
                  fontSize="2.3"
                >
                  {shortLabel(p.item, p.label)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {children}
    </div>
  );
}

function shortLabel(item: BayItem, label: string) {
  if (item === "fuse_box") return "Fusíveis";
  return label;
}
