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

// As fichas de cada carro ficam nos arquivos de curadoria
// (content/curadoria/*.json); o registro está em bay-sheets.ts.

/** Ponto onde o usuário verifica cada fluido acompanhado (vareta, reservatório). */
export function fluidCheckPoints(sheet: BayPositionSheet) {
  return sheet.points.flatMap((p) => {
    const fluid = BAY_ITEM_FLUID[p.item];
    return fluid ? [{ fluid, point: p }] : [];
  });
}
