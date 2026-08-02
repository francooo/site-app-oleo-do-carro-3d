import { relations } from "drizzle-orm";
import {
  boolean,
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
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ],
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

export const engineLayoutHotspots = pgTable("engine_layout_hotspots", {
  id: uuid("id").primaryKey().defaultRandom(),
  layoutId: uuid("layout_id")
    .notNull()
    .references(() => engineLayouts.id, { onDelete: "cascade" }),
  componentType: text("component_type")
    .notNull()
    .references(() => componentTypes.code),
  x: numeric("x", { precision: 5, scale: 2 }).notNull(),
  y: numeric("y", { precision: 5, scale: 2 }).notNull(),
  description: text("description"),
});

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
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
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
    plate: text("plate").notNull(),
    vin: text("vin"),
    make: text("make").notNull(),
    model: text("model").notNull(),
    year: integer("year").notNull(),
    trim: text("trim"),
    engineId: uuid("engine_id").references(() => engines.id),
    engineMatchStatus: engineMatchStatusEnum("engine_match_status")
      .notNull()
      .default("unmatched"),
    pendingTrimEngineMapId: uuid("pending_trim_engine_map_id").references(
      () => trimEngineMap.id,
    ),
    currentKm: integer("current_km"),
    kmUpdatedAt: timestamp("km_updated_at", { withTimezone: true }),
    photoUrl: text("photo_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Único por usuário, não globalmente: o mesmo carro pode trocar de dono
    // e ambos usarem o app (PRD 7).
    unique("vehicles_user_plate_unique").on(table.userId, table.plate),
    index("vehicles_user_id_idx").on(table.userId),
  ],
);

export const maintenanceRecords = pgTable(
  "maintenance_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    date: timestamp("date", { mode: "date", withTimezone: true }).notNull(),
    km: integer("km").notNull(),
    serviceType: text("service_type").notNull(),
    workshop: text("workshop"),
    parts: jsonb("parts"),
    totalValue: numeric("total_value", { precision: 10, scale: 2 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("maintenance_records_vehicle_id_idx").on(table.vehicleId)],
);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  maintenanceRecordId: uuid("maintenance_record_id")
    .notNull()
    .references(() => maintenanceRecords.id, { onDelete: "cascade" }),
  storagePath: text("storage_path").notNull(),
  mimeType: text("mime_type"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
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

export const trimEngineMapRelations = relations(trimEngineMap, ({ many }) => ({
  candidates: many(trimEngineCandidates),
}));

export const trimEngineCandidatesRelations = relations(
  trimEngineCandidates,
  ({ one }) => ({
    trimEngineMap: one(trimEngineMap, {
      fields: [trimEngineCandidates.trimEngineMapId],
      references: [trimEngineMap.id],
    }),
    engine: one(engines, {
      fields: [trimEngineCandidates.engineId],
      references: [engines.id],
    }),
  }),
);

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
}));

export const maintenanceRecordsRelations = relations(
  maintenanceRecords,
  ({ one, many }) => ({
    vehicle: one(vehicles, {
      fields: [maintenanceRecords.vehicleId],
      references: [vehicles.id],
    }),
    documents: many(documents),
  }),
);

export const documentsRelations = relations(documents, ({ one }) => ({
  maintenanceRecord: one(maintenanceRecords, {
    fields: [documents.maintenanceRecordId],
    references: [maintenanceRecords.id],
  }),
}));
