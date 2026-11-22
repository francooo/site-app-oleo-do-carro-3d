// Cena 3D do cofre do motor — só dados (sem three.js), reaproveitáveis pelo
// app Expo. É uma ILUSTRAÇÃO estilizada: as peças são caixas e cilindros
// posicionados como na foto real do cofre (public/brand/mapa-motor-piloto.webp).
// Quais pontos aparecem continua vindo do banco (engine_layout_hotspots);
// aqui só fica ONDE cada ponto está no espaço 3D.
//
// Eixos (metros, aproximado): x = esquerda→direita olhando de frente para o
// carro, y = altura, z = traseira (parede corta-fogo, negativo) → para-choque
// (positivo).

export type Vec3 = readonly [number, number, number];

/** Peça de contexto (não clicável): bloco, tampa, bateria, radiador… */
export type ScenePart = {
  id: string;
  shape: "box" | "rounded" | "cylinder";
  position: Vec3;
  /** box/rounded: largura, altura, profundidade. cylinder: raio, altura, raio. */
  size: Vec3;
  rotation?: Vec3;
  color: string;
  metalness?: number;
  roughness?: number;
  emissive?: string;
};

/** Mangueira decorativa: tubo passando pelos pontos. */
export type SceneHose = { id: string; points: readonly Vec3[]; radius: number };

/** Ponto de abastecimento/verificação ligado a um fluido. */
export type FillPoint =
  | {
      fluid: string;
      kind: "tank";
      /** Centro da base do reservatório. */
      position: Vec3;
      size: Vec3;
      capColor: string;
      /** Cor ilustrativa do líquido (não é especificação do produto). */
      liquidColor: string;
      /** Nível desenhado, 0 = MIN, 1 = MAX. */
      level: number;
    }
  | {
      fluid: string;
      kind: "dipstick";
      /** Centro da argola da vareta. */
      position: Vec3;
      color: string;
    };

export type EngineScene = {
  layoutCode: string;
  caption: string;
  camera: { position: Vec3; target: Vec3 };
  parts: readonly ScenePart[];
  hoses: readonly SceneHose[];
  fillPoints: readonly FillPoint[];
};

/** Onde o marcador do ponto fica (logo acima da tampa ou da argola). */
export function fillPointAnchor(p: FillPoint): Vec3 {
  if (p.kind === "dipstick") return [p.position[0], p.position[1] + 0.06, p.position[2]];
  const [x, y, z] = p.position;
  return [x, y + p.size[1] + 0.05, z];
}

/** Pontos da cena que o banco diz existir para este layout, na ordem do banco. */
export function visibleFillPoints(scene: EngineScene, fluidCodes: readonly string[]) {
  return fluidCodes
    .map((code) => scene.fillPoints.find((p) => p.fluid === code))
    .filter((p): p is FillPoint => p != null);
}

const DARK = "#1b1917";
const DARKER = "#121110";
const PLASTIC = "#1f1d1c";
const METAL = "#4a4643";

// Fiat Uno 1.0 Flex (Fire Evo) — mesma disposição da foto do piloto.
const FIAT_UNO_2016: EngineScene = {
  layoutCode: "fiat-uno-2016",
  caption: "Ilustração 3D do cofre do Fiat Uno 1.0 Flex — posições conforme o carro real.",
  camera: { position: [0, 1.8, 1.95], target: [0, 0.14, -0.06] },
  parts: [
    // Estrutura do cofre
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
    // Motor
    {
      id: "bloco",
      shape: "box",
      position: [0.02, 0.1, 0.0],
      size: [0.62, 0.34, 0.42],
      color: METAL,
      metalness: 0.65,
      roughness: 0.45,
    },
    {
      id: "coletor",
      shape: "cylinder",
      position: [0.02, 0.06, 0.26],
      size: [0.05, 0.5, 0.05],
      rotation: [0, 0, Math.PI / 2],
      color: "#6b6560",
      metalness: 0.8,
      roughness: 0.35,
    },
    {
      id: "tampa-motor",
      shape: "rounded",
      position: [0.0, 0.33, -0.02],
      size: [0.56, 0.1, 0.44],
      color: "#191817",
      roughness: 0.55,
    },
    {
      id: "tampa-relevo",
      shape: "rounded",
      position: [0.0, 0.385, -0.03],
      size: [0.4, 0.03, 0.3],
      color: "#242220",
      roughness: 0.5,
    },
    {
      id: "admissao",
      shape: "cylinder",
      position: [-0.02, 0.36, -0.36],
      size: [0.05, 0.5, 0.05],
      rotation: [0, 0, Math.PI / 2],
      color: PLASTIC,
    },
    {
      id: "filtro-ar",
      shape: "rounded",
      position: [-0.3, 0.38, -0.4],
      size: [0.22, 0.12, 0.16],
      color: PLASTIC,
    },
    // Lado direito: bateria e caixa de fusíveis
    {
      id: "bateria",
      shape: "rounded",
      position: [0.6, 0.17, 0.18],
      size: [0.24, 0.22, 0.18],
      color: "#151413",
    },
    {
      id: "polo-pos",
      shape: "cylinder",
      position: [0.53, 0.3, 0.14],
      size: [0.018, 0.04, 0.018],
      color: "#b03a2e",
    },
    {
      id: "polo-neg",
      shape: "cylinder",
      position: [0.67, 0.3, 0.14],
      size: [0.018, 0.04, 0.018],
      color: "#2b2b2b",
    },
    {
      id: "fusiveis",
      shape: "rounded",
      position: [0.62, 0.2, -0.14],
      size: [0.22, 0.16, 0.2],
      color: PLASTIC,
    },
  ],
  hoses: [
    {
      id: "radiador-motor",
      points: [
        [-0.45, 0.18, 0.45],
        [-0.36, 0.2, 0.3],
        [-0.28, 0.22, 0.12],
      ],
      radius: 0.022,
    },
    {
      id: "expansao-motor",
      points: [
        [-0.48, 0.34, 0.2],
        [-0.4, 0.36, 0.0],
        [-0.3, 0.3, -0.12],
      ],
      radius: 0.016,
    },
    {
      id: "freio-linha",
      points: [
        [0.5, 0.36, -0.42],
        [0.36, 0.3, -0.5],
        [0.2, 0.28, -0.56],
      ],
      radius: 0.01,
    },
    {
      id: "lavador-linha",
      points: [
        [-0.62, 0.5, -0.38],
        [-0.5, 0.56, -0.5],
        [-0.3, 0.57, -0.58],
      ],
      radius: 0.008,
    },
  ],
  fillPoints: [
    {
      fluid: "washer",
      kind: "tank",
      position: [-0.66, 0.0, -0.36],
      size: [0.17, 0.34, 0.17],
      capColor: "#2f6fd6",
      liquidColor: "#5aa9ff",
      level: 0.75,
    },
    {
      fluid: "brake",
      kind: "tank",
      position: [0.52, 0.28, -0.4],
      size: [0.17, 0.12, 0.13],
      capColor: "#151413",
      liquidColor: "#e6c77e",
      level: 0.7,
    },
    {
      fluid: "coolant",
      kind: "tank",
      position: [-0.56, 0.12, 0.22],
      size: [0.28, 0.2, 0.2],
      capColor: "#151413",
      liquidColor: "#e2577b",
      level: 0.55,
    },
    { fluid: "oil", kind: "dipstick", position: [0.27, 0.36, 0.2], color: "#f2b311" },
  ],
};

const SCENES: Record<string, EngineScene> = {
  [FIAT_UNO_2016.layoutCode]: FIAT_UNO_2016,
};

export function getEngineScene(layoutCode: string | null | undefined): EngineScene | null {
  return layoutCode ? (SCENES[layoutCode] ?? null) : null;
}
