import { CURATIONS } from "../content/curadoria";
import {
  type EngineDef,
  engineDefFromCuration,
  type FluidDef,
  upsertEngineCatalog,
} from "../lib/catalog/engine-catalog";
import { db } from "../lib/db/client";
import {
  insertPublishedCurationIfMissing,
  listPublishedCurations,
} from "../lib/db/queries/curations";
import { componentTypes, fluidTypes } from "../lib/db/schema";

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
  for (const def of ENGINES) await upsertEngineCatalog(def);
  // Carros da curadoria: os arquivos do repositório só entram se o layout
  // ainda não existir no banco (bootstrap). Depois, a fonte de verdade é a
  // curadoria online — o seed republica o que está publicado lá, sem
  // sobrescrever edições feitas em produção.
  for (const c of CURATIONS) await insertPublishedCurationIfMissing(c);
  const published = await listPublishedCurations();
  for (const c of published) await upsertEngineCatalog(engineDefFromCuration(c));
  console.log(
    `Seed ok: ${FLUID_TYPES.length} fluid_types, ${COMPONENT_TYPES.length} component_types, ${ENGINES.length + published.length} motores (${[...ENGINES.map((e) => e.engine.code), ...published.map((c) => c.engine.code)].join(", ")})`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
