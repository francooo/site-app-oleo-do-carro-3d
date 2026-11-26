// Modelo de cofre reutilizável: transforma uma ficha de posições
// (bay-positions.ts) no mapa 2D (planta) e na cena 3D. Só dados, sem React
// nem three.js — reaproveitável pelo app Expo.
//
// Cada carro novo precisa só da ficha; o desenho sai daqui. Cenas feitas à
// mão (engine-scene.ts, ex.: Uno) continuam tendo prioridade.

import {
  BAY_ITEM_FLUID,
  type BayItem,
  type BayPoint,
  type BayPositionSheet,
} from "./bay-positions";
import { getBayPositionSheet } from "./bay-sheets";
import type { EngineScene, FillPoint, ScenePart, SceneHose, Vec3 } from "./engine-scene";
import { getEngineScene } from "./engine-scene";

// ---------------------------------------------------------------------------
// Planta 2D (vista de frente achatada): painel em cima, para-choque embaixo.
// Posições em % da caixa da planta (proporção PLAN_ASPECT).
// ---------------------------------------------------------------------------

export const PLAN_ASPECT = { width: 10, height: 7 } as const;

const PLAN_X = { min: 9, max: 91 };
const PLAN_Y = { top: 16, bottom: 84 };

/** Posição do ponto na planta, em % (left/top). */
export function planPosition(p: Pick<BayPoint, "x" | "depth">) {
  const round = (n: number) => Math.round(n * 10) / 10;
  return {
    left: round(PLAN_X.min + p.x * (PLAN_X.max - PLAN_X.min)),
    top: round(PLAN_Y.top + (1 - p.depth) * (PLAN_Y.bottom - PLAN_Y.top)),
  };
}

/** Pontos clicáveis (um por fluido) para gravar em engine_layout_hotspots. */
export function planHotspots(sheet: BayPositionSheet) {
  return sheet.points.flatMap((p) => {
    const fluid = BAY_ITEM_FLUID[p.item];
    if (!fluid) return [];
    const { left, top } = planPosition(p);
    return [{ fluidType: fluid, x: left, y: top, description: p.label }];
  });
}

/** Peças de contexto da planta (sem fluido): bateria, filtro, fusíveis… */
export function planParts(sheet: BayPositionSheet) {
  return sheet.points
    .filter((p) => !BAY_ITEM_FLUID[p.item])
    .map((p) => ({ item: p.item, label: p.label, ...planPosition(p) }));
}

/** Retângulo do motor na planta, entre a vareta e a tampa do óleo. */
export function planEngine(sheet: BayPositionSheet) {
  const c = engineCenter(sheet);
  const { left, top } = planPosition(c);
  return { left, top, width: 30, height: 30 };
}

// ---------------------------------------------------------------------------
// Cena 3D (mesmos eixos de engine-scene.ts, em metros aproximados).
// ---------------------------------------------------------------------------

const toX = (x: number) => (x - 0.5) * 1.6;
const toZ = (depth: number) => 0.5 - depth * 1.1;
const BASE_Y = { low: 0.0, mid: 0.08, high: 0.2 } as const;

const DARK = "#1b1917";
const DARKER = "#121110";
const PLASTIC = "#1f1d1c";
const METAL = "#4a4643";

const DEFAULT_LIQUID: Record<string, string> = {
  washer: "#5aa9ff",
  coolant: "#e2577b",
  brake: "#e6c77e",
};

function engineCenter(sheet: BayPositionSheet) {
  const oil = sheet.points.filter((p) => p.item === "oil_dipstick" || p.item === "oil_cap");
  if (oil.length === 0) return { x: 0.45, depth: 0.5 };
  return {
    x: oil.reduce((s, p) => s + p.x, 0) / oil.length,
    depth: oil.reduce((s, p) => s + p.depth, 0) / oil.length,
  };
}

const TANK_SIZE: Record<string, Vec3> = {
  washer: [0.17, 0.3, 0.17],
  coolant: [0.22, 0.18, 0.18],
  brake: [0.15, 0.12, 0.12],
};

function fillPoint(p: BayPoint): FillPoint | null {
  const fluid = BAY_ITEM_FLUID[p.item];
  if (!fluid) return null;
  const x = toX(p.x);
  const z = toZ(p.depth);
  if (fluid === "oil") {
    return { fluid, kind: "dipstick", position: [x, 0.36, z], color: "#f2b311" };
  }
  return {
    fluid,
    kind: "tank",
    position: [x, BASE_Y[p.height], z],
    size: TANK_SIZE[fluid] ?? [0.16, 0.16, 0.16],
    capColor: fluid === "washer" ? "#2f6fd6" : "#151413",
    liquidColor: p.tint ?? DEFAULT_LIQUID[fluid] ?? "#9fb4c7",
    level: 0.7,
  };
}

const CONTEXT_PART: Partial<Record<BayItem, (p: BayPoint) => ScenePart[]>> = {
  oil_cap: (p) => [
    {
      id: "tampa-oleo",
      shape: "cylinder",
      position: [toX(p.x), 0.41, toZ(p.depth)],
      size: [0.035, 0.03, 0.035],
      color: "#d9a21b",
      roughness: 0.4,
    },
  ],
  air_filter: (p) => [
    {
      id: "filtro-ar",
      shape: "rounded",
      position: [toX(p.x), 0.28, toZ(p.depth)],
      size: [0.26, 0.14, 0.22],
      color: PLASTIC,
    },
  ],
  battery: (p) => {
    const [x, z] = [toX(p.x), toZ(p.depth)];
    return [
      {
        id: "bateria",
        shape: "rounded",
        position: [x, 0.17, z],
        size: [0.24, 0.22, 0.18],
        color: "#151413",
      },
      {
        id: "polo-pos",
        shape: "cylinder",
        position: [x - 0.07, 0.3, z + 0.04],
        size: [0.018, 0.04, 0.018],
        color: "#b03a2e",
      },
      {
        id: "polo-neg",
        shape: "cylinder",
        position: [x + 0.07, 0.3, z + 0.04],
        size: [0.018, 0.04, 0.018],
        color: "#2b2b2b",
      },
    ];
  },
  battery_remote_terminal: (p) => [
    {
      id: "terminal-remoto",
      shape: "rounded",
      position: [toX(p.x), 0.2, toZ(p.depth)],
      size: [0.06, 0.05, 0.06],
      color: "#7a2a22",
    },
  ],
  fuse_box: (p) => [
    {
      id: "fusiveis",
      shape: "rounded",
      position: [toX(p.x), 0.18, toZ(p.depth)],
      size: [0.2, 0.15, 0.2],
      color: PLASTIC,
    },
  ],
};

/** Estrutura comum de qualquer cofre: piso, para-lamas, painel, radiador, faróis. */
function shellParts(): ScenePart[] {
  return [
    { id: "piso", shape: "box", position: [0, -0.06, 0], size: [1.74, 0.08, 1.3], color: DARKER },
    {
      id: "para-lama-esq",
      shape: "box",
      position: [-0.88, 0.12, 0],
      size: [0.06, 0.4, 1.3],
      color: DARK,
    },
    {
      id: "para-lama-dir",
      shape: "box",
      position: [0.88, 0.12, 0],
      size: [0.06, 0.4, 1.3],
      color: DARK,
    },
    {
      id: "corta-fogo",
      shape: "box",
      position: [0, 0.26, -0.68],
      size: [1.74, 0.6, 0.06],
      color: DARK,
    },
    {
      id: "grade-cowl",
      shape: "box",
      position: [0, 0.55, -0.6],
      size: [1.6, 0.04, 0.16],
      color: PLASTIC,
    },
    {
      id: "travessa",
      shape: "box",
      position: [0, 0.2, 0.62],
      size: [1.64, 0.12, 0.1],
      color: PLASTIC,
    },
    {
      id: "radiador",
      shape: "box",
      position: [0, 0.06, 0.52],
      size: [1.2, 0.36, 0.05],
      color: "#2a2827",
      metalness: 0.4,
    },
    {
      id: "farol-esq",
      shape: "rounded",
      position: [-0.76, 0.2, 0.66],
      size: [0.2, 0.08, 0.04],
      color: "#d9d4cc",
      emissive: "#fff3dc",
    },
    {
      id: "farol-dir",
      shape: "rounded",
      position: [0.76, 0.2, 0.66],
      size: [0.2, 0.08, 0.04],
      color: "#d9d4cc",
      emissive: "#fff3dc",
    },
  ];
}

function engineParts(sheet: BayPositionSheet): ScenePart[] {
  const c = engineCenter(sheet);
  const [x, z] = [toX(c.x), toZ(c.depth)];
  return [
    {
      id: "bloco",
      shape: "box",
      position: [x, 0.1, z],
      size: [0.6, 0.34, 0.42],
      color: METAL,
      metalness: 0.65,
      roughness: 0.45,
    },
    {
      id: "tampa-motor",
      shape: "rounded",
      position: [x, 0.33, z],
      size: [0.56, 0.1, 0.44],
      color: "#191817",
      roughness: 0.55,
    },
    {
      id: "coletor",
      shape: "cylinder",
      position: [x, 0.06, z + 0.26],
      size: [0.05, 0.5, 0.05],
      rotation: [0, 0, Math.PI / 2],
      color: "#6b6560",
      metalness: 0.8,
      roughness: 0.35,
    },
  ];
}

function hoses(sheet: BayPositionSheet): SceneHose[] {
  const c = engineCenter(sheet);
  const engineSide: Vec3 = [toX(c.x) - 0.28, 0.22, toZ(c.depth)];
  const coolant = sheet.points.find((p) => p.item === "coolant");
  const out: SceneHose[] = [
    {
      id: "radiador-motor",
      points: [[-0.45, 0.18, 0.45], [(-0.45 + engineSide[0]) / 2, 0.2, 0.3], engineSide],
      radius: 0.022,
    },
  ];
  if (coolant) {
    const from: Vec3 = [toX(coolant.x), BASE_Y[coolant.height] + 0.12, toZ(coolant.depth)];
    out.push({
      id: "expansao-motor",
      points: [
        from,
        [(from[0] + engineSide[0]) / 2, 0.34, (from[2] + engineSide[2]) / 2],
        engineSide,
      ],
      radius: 0.016,
    });
  }
  return out;
}

export function sceneFromSheet(sheet: BayPositionSheet): EngineScene {
  const context = sheet.points.flatMap((p) => CONTEXT_PART[p.item]?.(p) ?? []);
  return {
    layoutCode: sheet.layoutCode,
    caption: `Ilustração 3D do ${sheet.title.replace(/^Cofre do /, "cofre do ")} — posições conforme a figura do manual.`,
    camera: { position: [0, 1.8, 1.95], target: [0, 0.14, -0.06] },
    parts: [...shellParts(), ...engineParts(sheet), ...context],
    hoses: hoses(sheet),
    fillPoints: sheet.points.map(fillPoint).filter((f): f is FillPoint => f != null),
  };
}

/** Visual do layout: cena feita à mão (se houver) ou gerada da ficha + planta 2D. */
export function getLayoutVisuals(layoutCode: string | null | undefined) {
  const sheet = getBayPositionSheet(layoutCode);
  const scene = getEngineScene(layoutCode) ?? (sheet ? sceneFromSheet(sheet) : null);
  return { sheet, scene };
}
