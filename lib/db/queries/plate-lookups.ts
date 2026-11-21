import { and, count, eq, gte, inArray } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { plateLookupAttempts, plateLookups } from "@/lib/db/schema";
import type { FipeVersion, PlateVehicle } from "@/lib/domain/plate-vehicle";

// `plate_lookups` é um cache compartilhado (uma linha por placa). A leitura
// por usuário passa SEMPRE por getLookupForUser, que exige uma tentativa do
// próprio usuário ligada à consulta — ninguém lê a placa de outra pessoa
// adivinhando um id.

export type PlateLookupRow = typeof plateLookups.$inferSelect;

/** Resultado `not_found` vale 30 dias; depois a placa pode ser consultada de novo. */
const NOT_FOUND_TTL_MS = 30 * 86_400_000;

export async function findCachedLookup(plate: string, now = new Date()) {
  const row = await db.query.plateLookups.findFirst({
    where: eq(plateLookups.plate, plate),
  });
  if (!row) return undefined;
  if (row.result === "not_found" && now.getTime() - row.createdAt.getTime() > NOT_FOUND_TTL_MS) {
    return undefined;
  }
  return row;
}

/** Grava (ou substitui, para `not_found` vencido) o resultado da placa. */
export async function savePlateLookup(input: {
  plate: string;
  provider: string;
  result: "found" | "not_found";
  vehicle: PlateVehicle | null;
  providerLookupId?: string | null;
  requestId?: string | null;
}) {
  const v = input.vehicle;
  const values = {
    plate: input.plate,
    provider: input.provider,
    result: input.result,
    providerLookupId: input.providerLookupId ?? null,
    requestId: input.requestId ?? null,
    make: v?.make ?? null,
    model: v?.model ?? null,
    version: v?.version ?? null,
    manufactureYear: v?.manufactureYear ?? null,
    modelYear: v?.modelYear ?? null,
    fuel: v?.fuel ?? null,
    engineDisplacement: v?.engineDisplacement ?? null,
    fipeCode: v?.fipeCode ?? null,
    fipeVersions: v?.fipeVersions ?? [],
    createdAt: new Date(),
  };
  const [row] = await db
    .insert(plateLookups)
    .values(values)
    .onConflictDoUpdate({ target: plateLookups.plate, set: values })
    .returning();
  return row!;
}

export async function recordAttempt(input: {
  userId: string;
  plate: string;
  source: string;
  outcome: string;
  plateLookupId?: string | null;
}) {
  await db.insert(plateLookupAttempts).values({
    userId: input.userId,
    plate: input.plate,
    source: input.source,
    outcome: input.outcome,
    plateLookupId: input.plateLookupId ?? null,
  });
}

/** Chamadas pagas a fornecedor (não conta cache nem placa inválida). */
const PROVIDER_SOURCES = ["consultadeplaca", "apibrasil"];

function startOfDay(now: Date) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function countUserProviderAttemptsToday(userId: string, now = new Date()) {
  const [row] = await db
    .select({ n: count() })
    .from(plateLookupAttempts)
    .where(
      and(
        eq(plateLookupAttempts.userId, userId),
        inArray(plateLookupAttempts.source, PROVIDER_SOURCES),
        gte(plateLookupAttempts.createdAt, startOfDay(now)),
      ),
    );
  return row?.n ?? 0;
}

export async function countProviderAttemptsToday(now = new Date()) {
  const [row] = await db
    .select({ n: count() })
    .from(plateLookupAttempts)
    .where(
      and(
        inArray(plateLookupAttempts.source, PROVIDER_SOURCES),
        gte(plateLookupAttempts.createdAt, startOfDay(now)),
      ),
    );
  return row?.n ?? 0;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A consulta, só se este usuário tiver feito uma tentativa ligada a ela. */
export async function getLookupForUser(lookupId: string, userId: string) {
  if (!UUID_RE.test(lookupId)) return undefined;
  const attempt = await db.query.plateLookupAttempts.findFirst({
    where: and(
      eq(plateLookupAttempts.plateLookupId, lookupId),
      eq(plateLookupAttempts.userId, userId),
    ),
    with: { lookup: true },
  });
  return attempt?.lookup ?? undefined;
}

/** Linha do banco → `PlateVehicle` (para a tela de confirmação). */
export function rowToPlateVehicle(row: PlateLookupRow): PlateVehicle | null {
  if (row.result !== "found" || !row.make || !row.model) return null;
  return {
    plate: row.plate,
    make: row.make,
    model: row.model,
    version: row.version,
    manufactureYear: row.manufactureYear,
    modelYear: row.modelYear,
    fuel: row.fuel,
    engineDisplacement: row.engineDisplacement,
    fipeCode: row.fipeCode,
    fipeVersions: Array.isArray(row.fipeVersions) ? (row.fipeVersions as FipeVersion[]) : [],
  };
}
