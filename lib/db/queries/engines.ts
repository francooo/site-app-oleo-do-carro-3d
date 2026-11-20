import { and, eq, gte, ilike, lte } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { engines, trimEngineCandidates, trimEngineMap } from "@/lib/db/schema";

// Catálogo curado: somente leitura para o app. Escrita acontece via script
// de curadoria com a connection string direta (ver seção 6 do PRD).

export async function listEngines() {
  return db.query.engines.findMany({
    with: { layout: true },
    orderBy: (fields, { asc }) => asc(fields.code),
  });
}

export async function countEngines() {
  const rows = await db.query.engines.findMany({ columns: { id: true } });
  return rows.length;
}

export async function getCatalogStats() {
  const [engineRows, fluidTypeRows, componentTypeRows] = await Promise.all([
    db.query.engines.findMany({ columns: { id: true } }),
    db.query.fluidTypes.findMany({ columns: { code: true } }),
    db.query.componentTypes.findMany({ columns: { code: true } }),
  ]);

  return {
    engines: engineRows.length,
    fluidTypes: fluidTypeRows.length,
    componentTypes: componentTypeRows.length,
  };
}

/**
 * Ficha técnica do motor: fluidos (com tipo e fonte) e layout com os pontos
 * do mapa. Catálogo curado — não é dado de usuário, sem filtro por userId.
 */
export async function getEngineSheet(engineId: string) {
  return db.query.engines.findFirst({
    where: eq(engines.id, engineId),
    with: {
      fluids: { with: { type: true, source: true } },
      layout: { with: { hotspots: true } },
    },
  });
}

export type EngineSheet = NonNullable<Awaited<ReturnType<typeof getEngineSheet>>>;

/** Combinações curadas de marca/modelo/ano com os motores candidatos. */
export async function getTrimCandidates(make: string, year: number) {
  const rows = await db
    .select({
      make: trimEngineMap.make,
      model: trimEngineMap.model,
      yearFrom: trimEngineMap.yearFrom,
      yearTo: trimEngineMap.yearTo,
      fuelType: trimEngineMap.fuelType,
      engineId: trimEngineCandidates.engineId,
      displacement: engines.displacement,
      isPrimary: trimEngineCandidates.isPrimary,
    })
    .from(trimEngineMap)
    .innerJoin(trimEngineCandidates, eq(trimEngineCandidates.trimEngineMapId, trimEngineMap.id))
    .innerJoin(engines, eq(engines.id, trimEngineCandidates.engineId))
    .where(
      and(
        ilike(trimEngineMap.make, make.trim()),
        lte(trimEngineMap.yearFrom, year),
        gte(trimEngineMap.yearTo, year),
      ),
    );
  return rows;
}

export async function listFluidTypes() {
  return db.query.fluidTypes.findMany({
    orderBy: (fields, { asc }) => asc(fields.displayOrder),
  });
}
