// Registro das fichas de posições: uma por arquivo de curadoria
// (content/curadoria/*.json, gerados pela ferramenta /curadoria).

import { CURATIONS } from "../../content/curadoria";

import type { BayPositionSheet } from "./bay-positions";
import { sheetFromCuration } from "./curation";

const SHEETS: Record<string, BayPositionSheet> = Object.fromEntries(
  CURATIONS.map((c) => [c.layout.code, sheetFromCuration(c)]),
);

export function getBayPositionSheet(layoutCode: string | null | undefined) {
  return layoutCode ? (SHEETS[layoutCode] ?? null) : null;
}

export const BAY_POSITION_SHEETS: readonly BayPositionSheet[] = Object.values(SHEETS);
