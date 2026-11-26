// Ficha de posições do cofre — só dados, reaproveitáveis pelo app Expo.
//
// É o FATO "onde fica cada item", tirado da figura do cofre do manual do
// proprietário. A figura em si tem direito autoral e não é publicada: o app
// redesenha o mapa no próprio estilo (2D/3D) a partir destas posições.
//
// Referencial (sempre olhando o carro DE FRENTE, capô aberto):
// - x: 0 = borda esquerda do cofre → 1 = borda direita. No Brasil (volante à
//   esquerda) o lado esquerdo da imagem é o lado do PASSAGEIRO.
// - depth: 0 = junto ao para-choque/radiador → 1 = junto à parede corta-fogo
//   (painel do carro).
// - height: altura aproximada do ponto de acesso (tampa, vareta).
// Valores estimados da figura, arredondados a 0,05.

import type { TrackedFluidCode } from "./fluids";

export type BayItem =
  | "washer"
  | "coolant"
  | "oil_dipstick"
  | "oil_cap"
  | "brake"
  | "air_filter"
  | "battery"
  | "battery_remote_terminal"
  | "fuse_box";

/** Item do cofre que é ponto de verificação de um fluido acompanhado. */
export const BAY_ITEM_FLUID: Partial<Record<BayItem, TrackedFluidCode>> = {
  washer: "washer",
  coolant: "coolant",
  oil_dipstick: "oil",
  brake: "brake",
};

export type BayPoint = {
  item: BayItem;
  /** Nome como o usuário vê no carro. */
  label: string;
  x: number;
  depth: number;
  height: "low" | "mid" | "high";
  /** Número do item na figura do manual (rastreabilidade da curadoria). */
  figureRef: number;
  /** Cor do líquido quando o manual diz (ex.: aditivo "laranja"). Ilustrativa. */
  tint?: string;
};

export type BayPositionSheet = {
  /** Mesmo código de engine_layouts.code. */
  layoutCode: string;
  title: string;
  source: { name: string; figurePage: number; legendPage: number };
  points: readonly BayPoint[];
};

// Chevrolet Onix / Onix Plus 1.0 Turbo (MY20–21). Manual do Proprietário
// Onix/Onix Plus 2021 (52165543): figura p.167 "Motor 1.0L L3 turbo",
// legenda p.168. Conferido com o texto: expansão "no lado do passageiro"
// (p.175) e filtro de ar "no lado do motorista" (p.173). O 1.0 aspirado tem
// outra figura (p.169), com vareta e tampa do óleo em ordem trocada.
const CHEVROLET_ONIX_TURBO_2020: BayPositionSheet = {
  layoutCode: "chevrolet-onix-turbo-2020",
  title: "Cofre do Chevrolet Onix / Onix Plus 1.0 Turbo",
  source: {
    name: "Manual do Proprietário Chevrolet Onix/Onix Plus 2021 (52165543)",
    figurePage: 167,
    legendPage: 168,
  },
  points: [
    {
      item: "washer",
      label: "Reservatório do lavador",
      x: 0.1,
      depth: 0.5,
      height: "mid",
      figureRef: 1,
    },
    {
      item: "coolant",
      label: "Reservatório de expansão (arrefecimento)",
      x: 0.1,
      depth: 0.7,
      height: "high",
      figureRef: 2,
      // p.217: aditivo ACDelco "longa vida – laranja".
      tint: "#f08a3c",
    },
    {
      item: "oil_dipstick",
      label: "Vareta do óleo",
      x: 0.4,
      depth: 0.5,
      height: "mid",
      figureRef: 3,
    },
    {
      item: "oil_cap",
      label: "Tampa de abastecimento do óleo",
      x: 0.45,
      depth: 0.6,
      height: "high",
      figureRef: 4,
    },
    {
      item: "brake",
      label: "Reservatório do fluido de freio",
      x: 0.65,
      depth: 0.9,
      height: "high",
      figureRef: 5,
    },
    {
      item: "air_filter",
      label: "Filtro de ar",
      x: 0.7,
      depth: 0.35,
      height: "mid",
      figureRef: 6,
    },
    {
      item: "battery",
      label: "Bateria",
      x: 0.7,
      depth: 0.7,
      height: "mid",
      figureRef: 7,
    },
    {
      item: "battery_remote_terminal",
      label: "Terminal positivo remoto (sob a tampa)",
      x: 0.8,
      depth: 0.65,
      height: "mid",
      figureRef: 8,
    },
    {
      item: "fuse_box",
      label: "Caixa de fusíveis",
      x: 0.9,
      depth: 0.7,
      height: "mid",
      figureRef: 9,
    },
  ],
};

const SHEETS: Record<string, BayPositionSheet> = {
  [CHEVROLET_ONIX_TURBO_2020.layoutCode]: CHEVROLET_ONIX_TURBO_2020,
};

export function getBayPositionSheet(layoutCode: string | null | undefined) {
  return layoutCode ? (SHEETS[layoutCode] ?? null) : null;
}

export const BAY_POSITION_SHEETS: readonly BayPositionSheet[] = Object.values(SHEETS);

/** Ponto onde o usuário verifica cada fluido acompanhado (vareta, reservatório). */
export function fluidCheckPoints(sheet: BayPositionSheet) {
  return sheet.points.flatMap((p) => {
    const fluid = BAY_ITEM_FLUID[p.item];
    return fluid ? [{ fluid, point: p }] : [];
  });
}
