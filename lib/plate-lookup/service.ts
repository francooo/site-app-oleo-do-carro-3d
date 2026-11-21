// Orquestra a consulta de placa de um usuário: valida → cache → limites →
// fornecedores → FIPE → grava. Usado pela Server Action (web) e pela rota
// JSON (app Expo). Só roda no servidor — usa chaves de API e o banco.

import {
  countProviderAttemptsToday,
  countUserProviderAttemptsToday,
  findCachedLookup,
  recordAttempt,
  savePlateLookup,
} from "@/lib/db/queries/plate-lookups";
import { isValidPlateFormat, normalizePlate } from "@/lib/plate";

import { lookupPlateWithProviders } from "./chain";
import { enrichFromFipe } from "./fipe";

export type PlateLookupResultForUser =
  | { status: "found"; lookupId: string; plate: string }
  | {
      status: "invalid" | "not_found" | "unavailable" | "limit" | "not_configured";
      plate: string;
    };

const intEnv = (name: string, fallback: number) => {
  const n = Number(process.env[name]);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
};

export async function lookupPlateForUser(
  userId: string,
  rawPlate: string,
): Promise<PlateLookupResultForUser> {
  const plate = normalizePlate(rawPlate);
  if (!isValidPlateFormat(plate)) return { status: "invalid", plate };

  // 1. Cache: a mesma placa nunca é paga duas vezes.
  const cached = await findCachedLookup(plate);
  if (cached) {
    await recordAttempt({
      userId,
      plate,
      source: "cache",
      outcome: cached.result,
      plateLookupId: cached.id,
    });
    return cached.result === "found"
      ? { status: "found", lookupId: cached.id, plate }
      : { status: "not_found", plate };
  }

  // 2. Limites diários (só chamadas pagas contam).
  const perUser = intEnv("PLATE_LOOKUP_DAILY_LIMIT_PER_USER", 5);
  const global = intEnv("PLATE_LOOKUP_DAILY_LIMIT_GLOBAL", 100);
  const [userCount, globalCount] = await Promise.all([
    countUserProviderAttemptsToday(userId),
    countProviderAttemptsToday(),
  ]);
  if (userCount >= perUser || globalCount >= global) {
    await recordAttempt({ userId, plate, source: "limit", outcome: "limit" });
    return { status: "limit", plate };
  }

  // 3. Fornecedores (principal → reserva).
  const { outcome, provider } = await lookupPlateWithProviders(plate);

  if (outcome.status === "found" && provider) {
    const vehicle = await enrichFromFipe(outcome.vehicle);
    const row = await savePlateLookup({
      plate,
      provider,
      result: "found",
      vehicle,
      providerLookupId: outcome.providerLookupId,
      requestId: outcome.requestId,
    });
    await recordAttempt({
      userId,
      plate,
      source: provider,
      outcome: "found",
      plateLookupId: row.id,
    });
    return { status: "found", lookupId: row.id, plate };
  }

  if (outcome.status === "not_found" && provider) {
    const row = await savePlateLookup({
      plate,
      provider,
      result: "not_found",
      vehicle: null,
      providerLookupId: outcome.providerLookupId,
      requestId: outcome.requestId,
    });
    await recordAttempt({
      userId,
      plate,
      source: provider,
      outcome: "not_found",
      plateLookupId: row.id,
    });
    return { status: "not_found", plate };
  }

  const status = outcome.status === "not_configured" ? "not_configured" : "unavailable";
  if (outcome.status !== "not_configured" && "detail" in outcome && outcome.detail) {
    // Sem chave e sem dado pessoal no log: só o código e o request_id.
    console.warn(`[placa] ${provider ?? "-"}: ${outcome.status} — ${outcome.detail}`);
  }
  await recordAttempt({
    userId,
    plate,
    source: provider ?? "none",
    outcome: outcome.status,
  });
  return { status, plate };
}
