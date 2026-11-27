import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  engineFluids,
  engineLayoutHotspots,
  engineLayouts,
  engines,
  sources,
  trimEngineCandidates,
  trimEngineMap,
} from "@/lib/db/schema";
import { planHotspots } from "@/lib/domain/bay-model";
import { type CurationFile, sheetFromCuration, validateCuration } from "@/lib/domain/curation";

// Grava um motor no catálogo (fonte, layout, pontos do mapa, fluidos e
// modelos/anos). Usado pelo seed e pelo botão "Publicar" da curadoria online.
// Idempotente: publicar de novo substitui pontos, fluidos e vínculos do motor.

export type FluidDef = Omit<typeof engineFluids.$inferInsert, "engineId" | "sourceId">;

export type EngineDef = {
  source: {
    name: string;
    type: "manual";
    reference: string | null;
    verifiedAt: Date;
    verifiedBy: string;
  };
  engine: {
    code: string;
    displacement: string;
    fuelType: "flex" | "gasoline" | "ethanol" | "diesel";
    cylinders?: number;
    aspiration?: "naturally_aspirated" | "turbo";
    notes: string;
  };
  /** Sem layout = só a ficha dos fluidos (nível 1), ainda sem mapa do cofre. */
  layout: { code: string; imageStoragePath: string | null; description: string } | null;
  hotspots: { fluidType: string; x: string; y: string; description: string }[];
  fluids: FluidDef[];
  trims: { make: string; model: string; yearFrom: number; yearTo: number; hint: string }[];
};

export async function upsertEngineCatalog(def: EngineDef) {
  let [source] = await db.select().from(sources).where(eq(sources.name, def.source.name));
  if (!source) {
    [source] = await db.insert(sources).values(def.source).returning();
  }

  let layoutId: string | null = null;
  if (def.layout) {
    await db
      .insert(engineLayouts)
      .values(def.layout)
      .onConflictDoUpdate({
        target: engineLayouts.code,
        set: { imageStoragePath: def.layout.imageStoragePath, description: def.layout.description },
      });
    const [layout] = await db
      .select()
      .from(engineLayouts)
      .where(eq(engineLayouts.code, def.layout.code));
    layoutId = layout.id;
    // Filhos sem chave natural: substitui o conjunto inteiro.
    await db.delete(engineLayoutHotspots).where(eq(engineLayoutHotspots.layoutId, layout.id));
    if (def.hotspots.length > 0) {
      await db
        .insert(engineLayoutHotspots)
        .values(def.hotspots.map((h) => ({ ...h, layoutId: layout.id })));
    }
  }

  const engineValues = {
    ...def.engine,
    cylinders: def.engine.cylinders ?? null,
    aspiration: def.engine.aspiration ?? null,
    layoutId,
  };
  await db
    .insert(engines)
    .values(engineValues)
    .onConflictDoUpdate({
      target: engines.code,
      set: {
        layoutId,
        notes: engineValues.notes,
        cylinders: engineValues.cylinders,
        aspiration: engineValues.aspiration,
      },
    });
  const [engine] = await db.select().from(engines).where(eq(engines.code, def.engine.code));

  await db.delete(engineFluids).where(eq(engineFluids.engineId, engine.id));
  await db
    .insert(engineFluids)
    .values(def.fluids.map((f) => ({ ...f, engineId: engine.id, sourceId: source.id })));

  for (const t of def.trims) {
    let [trim] = await db
      .select()
      .from(trimEngineMap)
      .where(
        and(
          eq(trimEngineMap.make, t.make),
          eq(trimEngineMap.model, t.model),
          eq(trimEngineMap.yearFrom, t.yearFrom),
          eq(trimEngineMap.yearTo, t.yearTo),
        ),
      );
    if (!trim) {
      [trim] = await db
        .insert(trimEngineMap)
        .values({
          make: t.make,
          model: t.model,
          yearFrom: t.yearFrom,
          yearTo: t.yearTo,
          fuelType: def.engine.fuelType,
          disambiguationHint: t.hint,
        })
        .returning();
    }
    // Mesmo ano/modelo pode ter vários motores (Onix 1.0 e 1.0 Turbo): só
    // substitui o vínculo deste motor, sem apagar os outros candidatos.
    await db
      .delete(trimEngineCandidates)
      .where(
        and(
          eq(trimEngineCandidates.trimEngineMapId, trim.id),
          eq(trimEngineCandidates.engineId, engine.id),
        ),
      );
    await db
      .insert(trimEngineCandidates)
      .values({ trimEngineMapId: trim.id, engineId: engine.id, isPrimary: false });
  }
}

// ---------------------------------------------------------------------------
// Demais carros: arquivos de curadoria (content/curadoria/*.json), gerados
// pela ferramenta /curadoria e revisados no diff. Arquivo inválido barra o seed.
// ---------------------------------------------------------------------------

export function engineDefFromCuration(c: CurationFile): EngineDef {
  const errors = validateCuration(c);
  if (errors.length > 0) {
    throw new Error(`Curadoria ${c.layout.code} inválida: ${errors.join(" | ")}`);
  }
  const sheet = sheetFromCuration(c);
  return {
    source: {
      name: c.source.name,
      type: "manual",
      reference: c.source.reference,
      verifiedAt: new Date(`${c.source.verifiedAt}T12:00:00Z`),
      verifiedBy: "Curadoria Fluido Fácil",
    },
    engine: {
      code: c.engine.code,
      displacement: c.engine.displacement,
      fuelType: c.engine.fuelType,
      cylinders: c.engine.cylinders ?? undefined,
      aspiration: c.engine.aspiration ?? undefined,
      notes: c.engine.notes,
    },
    // Sem foto curada: a planta 2D e o 3D saem da ficha de posições.
    layout: {
      code: c.layout.code,
      imageStoragePath: null,
      description: `${c.layout.title} visto de frente, capô aberto (planta gerada da figura p.${c.layout.figurePage} do manual).`,
    },
    hotspots: planHotspots(sheet).map((h) => ({ ...h, x: h.x.toFixed(2), y: h.y.toFixed(2) })),
    // `pages` é rastreabilidade da curadoria; não vai para engine_fluids.
    fluids: c.fluids.map((f) => {
      const { pages, ...fluid } = f;
      void pages;
      return fluid;
    }),
    trims: c.trims,
  };
}
