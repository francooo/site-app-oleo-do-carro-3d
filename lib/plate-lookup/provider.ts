// Contrato estável dos fornecedores de consulta de placa. A UI e o restante
// do app dependem só deste contrato (e de `PlateVehicle`), nunca de um SDK ou
// formato de fornecedor — trocar ou acrescentar fornecedor não toca tela.
//
// Fornecedores (decisão registrada em docs/ROADMAP.md):
//   - consultadeplaca  → principal (consultadeplaca.net, API v1)
//   - apibrasil        → reserva (APIBrasil "Agregados com Versão")
//   - placas.app.br    → previsto; adaptador entra quando houver conta

import type { PlateLookupOutcome } from "@/lib/domain/plate-vehicle";

export type { PlateLookupOutcome, PlateVehicle } from "@/lib/domain/plate-vehicle";

export const PLATE_PROVIDER_NAMES = ["consultadeplaca", "apibrasil"] as const;
export type PlateProviderName = (typeof PLATE_PROVIDER_NAMES)[number];

export interface PlateLookupProvider {
  readonly name: PlateProviderName;
  /** false quando falta a chave — a cadeia pula o fornecedor. */
  isConfigured(): boolean;
  /** Recebe a placa já normalizada e validada (lib/plate.ts). */
  lookup(plate: string): Promise<PlateLookupOutcome>;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** `Retry-After` em segundos → ms, limitado para não segurar a requisição. */
export function retryAfterMs(res: Response, fallbackMs: number, maxMs = 5_000) {
  const s = Number(res.headers.get("retry-after"));
  return Math.min(Number.isFinite(s) && s > 0 ? s * 1000 : fallbackMs, maxMs);
}
