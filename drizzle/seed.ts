import { and, eq } from "drizzle-orm";

import { db } from "../lib/db/client";
import { CURATIONS } from "../content/curadoria";
import { planHotspots } from "../lib/domain/bay-model";
import { type CurationFile, sheetFromCuration, validateCuration } from "../lib/domain/curation";
import {
  componentTypes,
  engineFluids,
  engineLayoutHotspots,
  engineLayouts,
  engines,
  fluidTypes,
  sources,
  trimEngineCandidates,
  trimEngineMap,
} from "../lib/db/schema";

// Tabelas de lookup (PRD seção 7, ajuste v2.2-c) + dados do piloto Fiat Uno
// 2016 1.0 Flex. Idempotente: pode rodar quantas vezes for preciso.

const FLUID_TYPES = [
  {
    code: "oil",
    label: "Óleo do motor",
    description: "Lubrifica e protege as peças internas do motor.",
    displayOrder: 1,
  },
  {
    code: "brake",
    label: "Fluido de freio",
    description: "Transmite a força do pedal para as rodas e faz o carro frear.",
    displayOrder: 2,
  },
  {
    code: "coolant",
    label: "Arrefecimento",
    description: "Controla a temperatura do motor e evita o superaquecimento.",
    displayOrder: 3,
  },
  {
    code: "transmission",
    label: "Fluido de transmissão",
    description: "Lubrifica as engrenagens da caixa de câmbio.",
    displayOrder: 4,
  },
  {
    code: "washer",
    label: "Limpador de para-brisa",
    description: "Limpa o para-brisa e melhora a visibilidade.",
    displayOrder: 5,
  },
];

const COMPONENT_TYPES = [
  { code: "oil_filter", label: "Filtro de óleo", displayOrder: 1 },
  { code: "air_filter", label: "Filtro de ar", displayOrder: 2 },
  { code: "cabin_filter", label: "Filtro de cabine", displayOrder: 3 },
  { code: "fuel_filter", label: "Filtro de combustível", displayOrder: 4 },
];

// ---------------------------------------------------------------------------
// Piloto: Fiat Uno 2016 1.0 Flex.
// Fonte: "Manual de Uso e Manutenção Fiat Uno", impresso 60355478, edição
// V/2013 (cobre Vivace 1.0 / Way 1.0 / 1.4). Páginas citadas por item. A
// edição é anterior ao ano-modelo do piloto — a tela exibe essa ressalva.
// ---------------------------------------------------------------------------

const PILOT_SOURCE = {
  name: "Manual de Uso e Manutenção Fiat Uno (impresso 60355478, edição V/2013)",
  type: "manual" as const,
  reference: "http://igorbarros.com.br/manuais/Fiat%20Uno.pdf",
  verifiedAt: new Date("2026-11-20T12:00:00Z"),
  verifiedBy: "Curadoria Fluido Fácil",
};

const PILOT_ENGINE = {
  code: "fiat-fire-1.0-flex",
  displacement: "1.0",
  fuelType: "flex" as const,
  notes:
    "Fiat Uno Vivace/Way 1.0 Fire Flex. Dados do manual edição V/2013; confirme no manual do seu carro se for outra versão.",
};

const PILOT_LAYOUT = {
  code: "fiat-uno-2016",
  imageStoragePath: "/brand/mapa-motor-piloto.webp",
  description: "Cofre do motor do Fiat Uno 1.0 Flex visto de frente, capô aberto.",
};

// Coordenadas em % sobre public/brand/mapa-motor-piloto.webp (960×940).
const PILOT_HOTSPOTS = [
  { fluidType: "washer", x: "8.50", y: "33.80", description: "Reservatório do lavador" },
  { fluidType: "brake", x: "82.60", y: "35.90", description: "Reservatório do fluido de freio" },
  { fluidType: "coolant", x: "14.20", y: "60.40", description: "Reservatório de expansão" },
  { fluidType: "oil", x: "69.60", y: "61.80", description: "Vareta e bocal do óleo" },
];

type FluidDef = Omit<typeof engineFluids.$inferInsert, "engineId" | "sourceId">;

const PILOT_FLUIDS: FluidDef[] = [
  {
    // E-16 (abastecimentos), E-18 (características), D-3/D-5 (troca), D-9.
    fluidType: "oil",
    specification: "Sintético SAE 5W30 — API SL e FIAT 9.55535",
    viscosity: "5W30",
    volumeMl: null,
    volumeWithFilterMl: 2700,
    volumeWithAcMl: null,
    intervalKm: 15000,
    intervalMonths: 12,
    checkIntervalKm: 500,
    warnings:
      "Produto homologado pela Fiat: Selènia K Pure Energy 5W30.",
  },
  {
    // E-16, E-18, D-5 (a cada 2 anos), D-9/D-10.
    fluidType: "coolant",
    specification: "50% Coolantup (vermelho, orgânico OAT) + 50% água pura",
    viscosity: null,
    volumeMl: 4900,
    volumeWithFilterMl: null,
    volumeWithAcMl: 5300,
    intervalKm: null,
    intervalMonths: 24,
    checkIntervalKm: 500,
    warnings:
      "Nunca use líquido de arrefecimento verde (não orgânico) nem misture outros aditivos.",
  },
  {
    // E-16, E-18, D-4/D-5 (a cada 24 meses), D-11/D-12.
    fluidType: "brake",
    specification: "Fluido sintético DOT 4 (SAE J 1703) — Tutela TOP 4/S",
    viscosity: null,
    volumeMl: null,
    volumeWithFilterMl: null,
    volumeWithAcMl: null,
    intervalKm: null,
    intervalMonths: 24,
    checkIntervalKm: 500,
    warnings:
      "Capacidade do circuito: 0,43 L com ABS ou 0,45 L sem ABS.",
  },
  {
    // E-16, D-5, D-10.
    fluidType: "washer",
    specification: "Água pura (opcional: 25% Tutela SC 35 + 75% de água)",
    viscosity: null,
    volumeMl: 2300,
    volumeWithFilterMl: null,
    volumeWithAcMl: null,
    intervalKm: null,
    intervalMonths: null,
    checkIntervalKm: 500,
    warnings: null,
  },
];

type EngineDef = {
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
  hotspots: typeof PILOT_HOTSPOTS;
  fluids: FluidDef[];
  trims: { make: string; model: string; yearFrom: number; yearTo: number; hint: string }[];
};

async function seedEngine(def: EngineDef) {
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

function engineDefFromCuration(c: CurationFile): EngineDef {
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
    fluids: c.fluids.map(({ pages: _pages, ...f }) => f),
    trims: c.trims,
  };
}

const ENGINES: EngineDef[] = [
  {
    source: PILOT_SOURCE,
    engine: PILOT_ENGINE,
    layout: PILOT_LAYOUT,
    hotspots: PILOT_HOTSPOTS,
    fluids: PILOT_FLUIDS,
    trims: [
      {
        make: "Fiat",
        model: "Uno",
        yearFrom: 2016,
        yearTo: 2016,
        hint: "Piloto: só 2016 1.0 Flex, conforme a fonte curada.",
      },
    ],
  },
  ...CURATIONS.map(engineDefFromCuration),
];

async function main() {
  for (const ft of FLUID_TYPES) {
    await db
      .insert(fluidTypes)
      .values(ft)
      .onConflictDoUpdate({
        target: fluidTypes.code,
        set: { label: ft.label, description: ft.description },
      });
  }
  await db.insert(componentTypes).values(COMPONENT_TYPES).onConflictDoNothing();
  for (const def of ENGINES) await seedEngine(def);
  console.log(
    `Seed ok: ${FLUID_TYPES.length} fluid_types, ${COMPONENT_TYPES.length} component_types, ${ENGINES.length} motores (${ENGINES.map((e) => e.engine.code).join(", ")})`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
