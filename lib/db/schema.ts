import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ---------------------------------------------------------------------------
// Auth.js (NextAuth v5) tables — shape required by @auth/drizzle-adapter.
// `passwordHash` and `acceptedTermsAt` are additions for the Credentials
// (email/senha) provider and the PRD's terms-acceptance requirement (5.1) —
// Auth.js itself does not manage passwords.
// ---------------------------------------------------------------------------

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
  }),
  image: text("image"),
  passwordHash: text("password_hash"),
  acceptedTermsAt: timestamp("accepted_terms_at", { withTimezone: true }),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })],
);

export const sessions = pgTable("session", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

// ---------------------------------------------------------------------------
// Catálogo curado — somente-leitura para o app (ver seção 6 do PRD).
// Escrita acontece via script de curadoria com a connection string direta,
// nunca por rota da aplicação.
// ---------------------------------------------------------------------------

export const fuelTypeEnum = pgEnum("fuel_type", [
  "gasoline",
  "ethanol",
  "flex",
  "diesel",
  "hybrid",
  "electric",
]);

export const aspirationEnum = pgEnum("aspiration", [
  "naturally_aspirated",
  "turbo",
  "supercharged",
  "hybrid",
]);

export const sourceTypeEnum = pgEnum("source_type", [
  "manual",
  "licensed_db",
  "catalog",
  "curated",
]);

// Tabelas de lookup em vez de enum — novos tipos aparecem conforme a
// curadoria avança e alterar um enum do Postgres é mais fricção que inserir
// uma linha (PRD 7, ajuste v2.2-c).
export const fluidTypes = pgTable("fluid_types", {
  code: text("code").primaryKey(),
  label: text("label").notNull(),
  /** "Para que serve?" — texto geral, vale para qualquer motor. */
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
});

export const componentTypes = pgTable("component_types", {
  code: text("code").primaryKey(),
  label: text("label").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
});

export const engineLayouts = pgTable("engine_layouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  imageStoragePath: text("image_storage_path"),
  description: text("description"),
});

export const engines = pgTable("engines", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  displacement: numeric("displacement", { precision: 3, scale: 1 }),
  cylinders: integer("cylinders"),
  fuelType: fuelTypeEnum("fuel_type").notNull(),
  // Nullable: um motor sem imagem curada ainda não bloqueia o cadastro
  // (PRD 7, ajuste v2.2).
  layoutId: uuid("layout_id").references(() => engineLayouts.id),
  aspiration: aspirationEnum("aspiration"),
  notes: text("notes"),
});

// Um ponto do mapa aponta para um componente (filtro) OU para um fluido
// (reservatório) — o CHECK garante exatamente um dos dois.
export const engineLayoutHotspots = pgTable(
  "engine_layout_hotspots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    layoutId: uuid("layout_id")
      .notNull()
      .references(() => engineLayouts.id, { onDelete: "cascade" }),
    componentType: text("component_type").references(() => componentTypes.code),
    fluidType: text("fluid_type").references(() => fluidTypes.code),
    x: numeric("x", { precision: 5, scale: 2 }).notNull(),
    y: numeric("y", { precision: 5, scale: 2 }).notNull(),
    description: text("description"),
  },
  (table) => [
    check(
      "engine_layout_hotspots_target_check",
      sql`(${table.componentType} is null) <> (${table.fluidType} is null)`,
    ),
  ],
);

// Sem `engine_id` direto: o colapso de candidatos (PRD 5.2) exige suportar
// múltiplos motores candidatos por combinação marca/modelo/ano/versão —
// ver `trimEngineCandidates` (PRD 7, ajuste v2.2-a).
export const trimEngineMap = pgTable(
  "trim_engine_map",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    make: text("make").notNull(),
    model: text("model").notNull(),
    yearFrom: integer("year_from").notNull(),
    yearTo: integer("year_to").notNull(),
    trimLabel: text("trim_label"),
    fuelType: fuelTypeEnum("fuel_type"),
    disambiguationHint: text("disambiguation_hint"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("trim_engine_map_make_model_year_idx").on(
      table.make,
      table.model,
      table.yearFrom,
      table.yearTo,
    ),
  ],
);

export const trimEngineCandidates = pgTable("trim_engine_candidates", {
  id: uuid("id").primaryKey().defaultRandom(),
  trimEngineMapId: uuid("trim_engine_map_id")
    .notNull()
    .references(() => trimEngineMap.id, { onDelete: "cascade" }),
  engineId: uuid("engine_id")
    .notNull()
    .references(() => engines.id),
  isPrimary: boolean("is_primary").notNull().default(false),
  notes: text("notes"),
});

export const sources = pgTable("sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: sourceTypeEnum("type").notNull(),
  reference: text("reference"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedBy: text("verified_by"),
});

export const engineFluids = pgTable(
  "engine_fluids",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    engineId: uuid("engine_id")
      .notNull()
      .references(() => engines.id, { onDelete: "cascade" }),
    fluidType: text("fluid_type")
      .notNull()
      .references(() => fluidTypes.code),
    specification: text("specification").notNull(),
    viscosity: text("viscosity"),
    volumeMl: integer("volume_ml"),
    volumeWithFilterMl: integer("volume_with_filter_ml"),
    /** Capacidade alternativa com aquecedor e/ou ar-condicionado
     *  (ex.: arrefecimento do Uno 1.0: 4,9 L base, 5,3 L com A/C). */
    volumeWithAcMl: integer("volume_with_ac_ml"),
    /** Frequência de verificação do nível indicada pela fonte
     *  (Uno: "a cada 500 km ou antes de viagens longas"). */
    checkIntervalKm: integer("check_interval_km"),
    intervalKm: integer("interval_km"),
    intervalMonths: integer("interval_months"),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id),
    warnings: text("warnings"),
  },
  (table) => [index("engine_fluids_engine_id_idx").on(table.engineId)],
);

export const components = pgTable(
  "components",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    engineId: uuid("engine_id")
      .notNull()
      .references(() => engines.id, { onDelete: "cascade" }),
    componentType: text("component_type")
      .notNull()
      .references(() => componentTypes.code),
    oemCode: text("oem_code"),
    crossReferences: jsonb("cross_references"),
    intervalKm: integer("interval_km"),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id),
  },
  (table) => [index("components_engine_id_idx").on(table.engineId)],
);

// ---------------------------------------------------------------------------
// Dados do usuário — todo acesso deve passar por lib/db/queries/*, que
// aplica o filtro por userId. Não há RLS de banco (ver seção 6 do PRD):
// só o servidor Next.js fala com o Postgres, então a fronteira de
// autorização é a camada de aplicação, não uma policy de banco.
// ---------------------------------------------------------------------------

export const engineMatchStatusEnum = pgEnum("engine_match_status", [
  "unmatched",
  "pending_disambiguation",
  "confirmed",
  "manual_override",
]);

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Opcional desde o Fluido Fácil: o cadastro (tela 01) identifica o carro
    // por marca/modelo/ano/versão. Postgres trata NULLs como distintos, então
    // a unique (user_id, plate) continua valendo só para placas preenchidas.
    plate: text("plate"),
    vin: text("vin"),
    make: text("make").notNull(),
    model: text("model").notNull(),
    year: integer("year").notNull(),
    trim: text("trim"),
    /** Versão comercial informada pelo usuário (ex.: "Attractive", "Way"). */
    version: text("version"),
    /** Cilindrada como exibida ao usuário (ex.: "1.0"). */
    engineDisplacement: text("engine_displacement"),
    /** Mesmo enum dos motores; rótulos em lib/domain/vehicle.ts (FUEL_LABEL). */
    fuel: fuelTypeEnum("fuel"),
    /** Muda a capacidade do arrefecimento (ex.: Uno 1.0: 4,9 L vs 5,3 L). */
    hasAirConditioning: boolean("has_air_conditioning"),
    /** Preenchido na tela "Confirme seu veículo"; zerado ao editar os dados. */
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    engineId: uuid("engine_id").references(() => engines.id),
    engineMatchStatus: engineMatchStatusEnum("engine_match_status").notNull().default("unmatched"),
    pendingTrimEngineMapId: uuid("pending_trim_engine_map_id").references(() => trimEngineMap.id),
    currentKm: integer("current_km"),
    kmUpdatedAt: timestamp("km_updated_at", { withTimezone: true }),
    photoUrl: text("photo_url"),
    /** Código FIPE da versão escolhida no cadastro pela placa. */
    fipeCode: text("fipe_code"),
    /** Consulta de placa que originou o cadastro (nulo = cadastro manual). */
    plateLookupId: uuid("plate_lookup_id").references(() => plateLookups.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Único por usuário, não globalmente: o mesmo carro pode trocar de dono
    // e ambos usarem o app (PRD 7).
    unique("vehicles_user_plate_unique").on(table.userId, table.plate),
    index("vehicles_user_id_idx").on(table.userId),
  ],
);

// ---------------------------------------------------------------------------
// Cadastro pela placa (lib/plate-lookup). `plate_lookups` é um cache
// COMPARTILHADO por placa — cada placa é paga uma vez só — e guarda apenas o
// que identifica o carro (sem cidade, cor, chassi ou dono: LGPD).
// `plate_lookup_attempts` registra cada tentativa por usuário: é o funil do
// ROADMAP e a base dos limites diários. Usuário só lê uma consulta se tiver
// uma tentativa ligada a ela (lib/db/queries/plate-lookups.ts).
// ---------------------------------------------------------------------------

export const plateLookups = pgTable(
  "plate_lookups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Normalizada (lib/plate.ts): maiúsculas, sem traço. */
    plate: text("plate").notNull(),
    /** Fornecedor que respondeu (lib/plate-lookup/provider.ts). */
    provider: text("provider").notNull(),
    providerLookupId: text("provider_lookup_id"),
    requestId: text("request_id"),
    /** "found" | "not_found". */
    result: text("result").notNull(),
    make: text("make"),
    model: text("model"),
    version: text("version"),
    manufactureYear: integer("manufacture_year"),
    modelYear: integer("model_year"),
    fuel: fuelTypeEnum("fuel"),
    engineDisplacement: text("engine_displacement"),
    fipeCode: text("fipe_code"),
    /** FipeVersion[] (lib/domain/plate-vehicle.ts). */
    fipeVersions: jsonb("fipe_versions"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("plate_lookups_plate_unique").on(table.plate)],
);

export const plateLookupAttempts = pgTable(
  "plate_lookup_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    plate: text("plate").notNull(),
    plateLookupId: uuid("plate_lookup_id").references(() => plateLookups.id, {
      onDelete: "set null",
    }),
    /** "cache" ou o nome do fornecedor que foi chamado. */
    source: text("source").notNull(),
    /** found | not_found | unavailable | quota_exceeded | not_configured | limit | invalid. */
    outcome: text("outcome").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("plate_lookup_attempts_user_created_idx").on(table.userId, table.createdAt),
    index("plate_lookup_attempts_created_idx").on(table.createdAt),
  ],
);

// "verificar nível" ≠ "trocar fluido" (critério de UX §5). `servico` cobre
// registros livres (revisão, peças) que não são de um fluido específico.
export const maintenanceKindEnum = pgEnum("maintenance_kind", [
  "verificacao",
  "complemento",
  "troca",
  "servico",
]);

export const checkResultEnum = pgEnum("check_result", [
  "ok",
  "baixo_completei",
  "baixo_nao_completei",
]);

// Fonte única de verdade do status dos fluidos: o status é DERIVADO dos
// registros (lib/domain/fluid-status.ts), não guardado em tabela própria.
export const maintenanceRecords = pgTable(
  "maintenance_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    date: timestamp("date", { mode: "date", withTimezone: true }).notNull(),
    /** Nulo quando o usuário não sabe a quilometragem na hora. */
    km: integer("km"),
    kind: maintenanceKindEnum("kind").notNull().default("servico"),
    fluidType: text("fluid_type").references(() => fluidTypes.code),
    checkResult: checkResultEnum("check_result"),
    serviceType: text("service_type").notNull(),
    workshop: text("workshop"),
    parts: jsonb("parts"),
    totalValue: numeric("total_value", { precision: 10, scale: 2 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("maintenance_records_vehicle_id_idx").on(table.vehicleId),
    index("maintenance_records_vehicle_fluid_idx").on(table.vehicleId, table.fluidType, table.date),
  ],
);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  maintenanceRecordId: uuid("maintenance_record_id")
    .notNull()
    .references(() => maintenanceRecords.id, { onDelete: "cascade" }),
  storagePath: text("storage_path").notNull(),
  mimeType: text("mime_type"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Preferências do usuário (1:1 com user). Guarda o carro selecionado — o
// "contexto" das telas técnicas (critério de UX: o usuário sempre sabe qual
// carro está vendo) — e as escolhas de notificação do Perfil.
// ---------------------------------------------------------------------------

export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  selectedVehicleId: uuid("selected_vehicle_id").references(() => vehicles.id, {
    onDelete: "set null",
  }),
  notifyReminders: boolean("notify_reminders").notNull().default(true),
  notifyPush: boolean("notify_push").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Relations (leitura conveniente via db.query.*; não afeta o schema SQL)
// ---------------------------------------------------------------------------

export const enginesRelations = relations(engines, ({ one, many }) => ({
  layout: one(engineLayouts, {
    fields: [engines.layoutId],
    references: [engineLayouts.id],
  }),
  fluids: many(engineFluids),
  components: many(components),
}));

export const engineLayoutsRelations = relations(engineLayouts, ({ many }) => ({
  engines: many(engines),
  hotspots: many(engineLayoutHotspots),
}));

// Lado "one" das relações many() acima — sem eles o db.query não consegue
// resolver `engine.fluids`/`layout.hotspots` ("not enough information to
// infer relation").
export const engineFluidsRelations = relations(engineFluids, ({ one }) => ({
  engine: one(engines, {
    fields: [engineFluids.engineId],
    references: [engines.id],
  }),
  type: one(fluidTypes, {
    fields: [engineFluids.fluidType],
    references: [fluidTypes.code],
  }),
  source: one(sources, {
    fields: [engineFluids.sourceId],
    references: [sources.id],
  }),
}));

export const componentsRelations = relations(components, ({ one }) => ({
  engine: one(engines, {
    fields: [components.engineId],
    references: [engines.id],
  }),
  source: one(sources, {
    fields: [components.sourceId],
    references: [sources.id],
  }),
}));

export const engineLayoutHotspotsRelations = relations(engineLayoutHotspots, ({ one }) => ({
  layout: one(engineLayouts, {
    fields: [engineLayoutHotspots.layoutId],
    references: [engineLayouts.id],
  }),
  fluid: one(fluidTypes, {
    fields: [engineLayoutHotspots.fluidType],
    references: [fluidTypes.code],
  }),
}));

export const trimEngineMapRelations = relations(trimEngineMap, ({ many }) => ({
  candidates: many(trimEngineCandidates),
}));

export const trimEngineCandidatesRelations = relations(trimEngineCandidates, ({ one }) => ({
  trimEngineMap: one(trimEngineMap, {
    fields: [trimEngineCandidates.trimEngineMapId],
    references: [trimEngineMap.id],
  }),
  engine: one(engines, {
    fields: [trimEngineCandidates.engineId],
    references: [engines.id],
  }),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  user: one(users, { fields: [vehicles.userId], references: [users.id] }),
  engine: one(engines, {
    fields: [vehicles.engineId],
    references: [engines.id],
  }),
  pendingTrimEngineMap: one(trimEngineMap, {
    fields: [vehicles.pendingTrimEngineMapId],
    references: [trimEngineMap.id],
  }),
  maintenanceRecords: many(maintenanceRecords),
  plateLookup: one(plateLookups, {
    fields: [vehicles.plateLookupId],
    references: [plateLookups.id],
  }),
}));

export const plateLookupAttemptsRelations = relations(plateLookupAttempts, ({ one }) => ({
  user: one(users, { fields: [plateLookupAttempts.userId], references: [users.id] }),
  lookup: one(plateLookups, {
    fields: [plateLookupAttempts.plateLookupId],
    references: [plateLookups.id],
  }),
}));

export const maintenanceRecordsRelations = relations(maintenanceRecords, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [maintenanceRecords.vehicleId],
    references: [vehicles.id],
  }),
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  maintenanceRecord: one(maintenanceRecords, {
    fields: [documents.maintenanceRecordId],
    references: [maintenanceRecords.id],
  }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  selectedVehicle: one(vehicles, {
    fields: [userPreferences.selectedVehicleId],
    references: [vehicles.id],
  }),
}));

// ---------------------------------------------------------------------------
// Curadoria online (/curadoria, só administradores). Cada linha é um carro:
// o arquivo de curadoria inteiro (lib/domain/curation.ts) em `data`. Rascunho
// não aparece para ninguém; "Publicar" grava o catálogo (motor, fluidos,
// layout, pontos, modelos) e vincula os carros que estavam na fila.
// ---------------------------------------------------------------------------
export const curationStatusEnum = pgEnum("curation_status", ["draft", "published"]);

export const curations = pgTable(
  "curations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** = engine_layouts.code; um carro (layout) por linha. */
    layoutCode: text("layout_code").notNull().unique(),
    /** CurationFile completo. */
    data: jsonb("data").notNull(),
    status: curationStatusEnum("status").notNull().default("draft"),
    /** Há mudanças salvas depois da última publicação. */
    hasUnpublishedChanges: boolean("has_unpublished_changes").notNull().default(true),
    /** Conteúdo exatamente como foi publicado (o mapa lê daqui). */
    publishedData: jsonb("published_data"),
    updatedByEmail: text("updated_by_email"),
    publishedByEmail: text("published_by_email"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("curations_status_idx").on(table.status)],
);
