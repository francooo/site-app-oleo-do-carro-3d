// Arquivo de curadoria: TUDO que um carro precisa para ganhar ficha e mapa,
// num formato só (content/curadoria/<layout>.json). Gerado pela ferramenta
// /curadoria, revisado por uma pessoa no diff e publicado com
// `pnpm db:seed && pnpm db:relink`. Só dados e regras puras — sem banco.

import {
  BAY_ITEM_FLUID,
  type BayItem,
  type BayPoint,
  type BayPositionSheet,
} from "./bay-positions";
import { TRACKED_FLUIDS, type TrackedFluidCode } from "./fluids";

export const BAY_ITEMS: readonly { item: BayItem; label: string }[] = [
  { item: "washer", label: "Reservatório do lavador" },
  { item: "coolant", label: "Reservatório de expansão (arrefecimento)" },
  { item: "oil_dipstick", label: "Vareta do óleo" },
  { item: "oil_cap", label: "Tampa de abastecimento do óleo" },
  { item: "brake", label: "Reservatório do fluido de freio" },
  { item: "air_filter", label: "Filtro de ar" },
  { item: "battery", label: "Bateria" },
  { item: "battery_remote_terminal", label: "Terminal positivo remoto" },
  { item: "fuse_box", label: "Caixa de fusíveis" },
];

export type CurationFluid = {
  fluidType: TrackedFluidCode;
  specification: string;
  viscosity: string | null;
  volumeMl: number | null;
  volumeWithFilterMl: number | null;
  volumeWithAcMl: number | null;
  intervalKm: number | null;
  intervalMonths: number | null;
  checkIntervalKm: number | null;
  warnings: string | null;
  /** Páginas da fonte de onde saiu cada valor (rastreabilidade). */
  pages: string;
};

export type CurationFile = {
  version: 1;
  layout: { code: string; title: string; figurePage: number; legendPage: number };
  source: { name: string; reference: string | null; verifiedAt: string };
  /** Segunda fonte independente que confirma os valores principais. */
  secondSource: string;
  engine: {
    code: string;
    displacement: string;
    fuelType: "flex" | "gasoline" | "ethanol" | "diesel";
    cylinders: number | null;
    aspiration: "naturally_aspirated" | "turbo" | null;
    notes: string;
  };
  trims: { make: string; model: string; yearFrom: number; yearTo: number; hint: string }[];
  points: BayPoint[];
  fluids: CurationFluid[];
};

const SLUG = /^[a-z0-9]+(-[a-z0-9.]+)*$/;
const TRACKED = TRACKED_FLUIDS.map((f) => f.code);

/** Lista de problemas em português; vazia = pode salvar. */
export function validateCuration(c: CurationFile): string[] {
  const errors: string[] = [];
  const req = (ok: unknown, msg: string) => {
    if (!ok) errors.push(msg);
  };

  req(SLUG.test(c.layout.code), "Código do layout: use letras minúsculas, números e hífens.");
  req(c.layout.title.trim(), "Dê um título ao cofre (ex.: Cofre do Chevrolet Onix 1.0 Turbo).");
  req(c.layout.figurePage > 0, "Informe a página da figura do cofre no manual.");
  req(c.source.name.trim(), "Informe o nome da fonte (manual do proprietário).");
  req(c.secondSource.trim(), "Informe a segunda fonte que confirma os valores principais.");
  req(
    SLUG.test(c.engine.code),
    "Código do motor: use letras minúsculas, números, pontos e hífens.",
  );
  req(/^\d\.\d$/.test(c.engine.displacement), "Cilindrada no formato 1.0, 1.6…");

  req(c.trims.length > 0, "Informe ao menos um modelo e faixa de anos.");
  for (const t of c.trims) {
    req(t.make.trim() && t.model.trim(), "Cada modelo precisa de marca e modelo.");
    req(
      t.yearFrom >= 1990 && t.yearTo >= t.yearFrom && t.yearTo <= 2100,
      `Anos inválidos em ${t.make} ${t.model}.`,
    );
  }

  const items = c.points.map((p) => p.item);
  req(new Set(items).size === items.length, "Há um item marcado duas vezes na figura.");
  for (const p of c.points) {
    req(p.x >= 0 && p.x <= 1 && p.depth >= 0 && p.depth <= 1, `Posição fora do cofre: ${p.label}.`);
  }
  for (const code of TRACKED) {
    const has = c.points.some((p) => BAY_ITEM_FLUID[p.item] === code);
    const label = TRACKED_FLUIDS.find((f) => f.code === code)!.label;
    req(has, `Marque na figura o ponto de verificação de: ${label}.`);
    const fluid = c.fluids.find((f) => f.fluidType === code);
    req(fluid?.specification.trim(), `Preencha a especificação de: ${label}.`);
    req(fluid?.pages.trim(), `Informe as páginas da fonte de: ${label}.`);
  }
  for (const f of c.fluids) {
    for (const [k, v] of Object.entries(f)) {
      if (typeof v === "number")
        req(v > 0 && Number.isInteger(v), `Valor inválido em ${f.fluidType}.${k}.`);
    }
  }
  return errors;
}

/** A ficha de posições que o modelo de cofre (bay-model.ts) desenha. */
export function sheetFromCuration(c: CurationFile): BayPositionSheet {
  return {
    layoutCode: c.layout.code,
    title: c.layout.title,
    source: {
      name: c.source.name,
      figurePage: c.layout.figurePage,
      legendPage: c.layout.legendPage,
    },
    points: c.points,
  };
}

/** Clique na figura (% da imagem) → ponto da ficha. Topo da figura = painel. */
export function pointFromFigureClick(
  item: BayItem,
  xPct: number,
  yPct: number,
  figureRef: number,
  height: BayPoint["height"] = "mid",
): BayPoint {
  const round = (n: number) => Math.round(Math.min(Math.max(n, 0), 1) * 100) / 100;
  return {
    item,
    label: BAY_ITEMS.find((b) => b.item === item)?.label ?? item,
    x: round(xPct / 100),
    depth: round(1 - yPct / 100),
    height,
    figureRef,
  };
}

export function emptyCuration(): CurationFile {
  return {
    version: 1,
    layout: { code: "", title: "", figurePage: 0, legendPage: 0 },
    source: { name: "", reference: null, verifiedAt: new Date().toISOString().slice(0, 10) },
    secondSource: "",
    engine: {
      code: "",
      displacement: "1.0",
      fuelType: "flex",
      cylinders: null,
      aspiration: null,
      notes: "",
    },
    trims: [{ make: "", model: "", yearFrom: 2020, yearTo: 2020, hint: "" }],
    points: [],
    fluids: TRACKED.map((fluidType) => ({
      fluidType,
      specification: "",
      viscosity: null,
      volumeMl: null,
      volumeWithFilterMl: null,
      volumeWithAcMl: null,
      intervalKm: null,
      intervalMonths: null,
      checkIntervalKm: null,
      warnings: null,
      pages: "",
    })),
  };
}
