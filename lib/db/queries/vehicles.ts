import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { userPreferences, vehicles } from "@/lib/db/schema";
import type { VehicleInput } from "@/lib/domain/vehicle";
import { normalizePlate } from "@/lib/plate";

// Toda leitura/escrita de `vehicles` passa por aqui e recebe `userId`
// explicitamente — é essa disciplina que substitui a RLS de banco (ver
// seção 6 do PRD). Nunca faça `db.select().from(vehicles)` direto em uma
// rota ou server action.

export type Vehicle = typeof vehicles.$inferSelect;

export async function getVehiclesByUser(userId: string) {
  return db.query.vehicles.findMany({
    where: eq(vehicles.userId, userId),
    with: { engine: true },
    orderBy: (fields, { desc }) => desc(fields.createdAt),
  });
}

export async function getVehicleByIdForUser(userId: string, vehicleId: string) {
  // id malformado viraria erro de cast do Postgres (500) — trata como "não achou".
  if (!isUuid(vehicleId)) return undefined;
  return db.query.vehicles.findFirst({
    where: and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId)),
    with: { engine: { with: { fluids: true, layout: true } } },
  });
}

/**
 * Carro selecionado (contexto das telas técnicas). Usa a preferência salva
 * e, se ela não existir ou apontar para um carro que não é mais do usuário,
 * cai no cadastro mais recente.
 */
export async function getSelectedVehicleForUser(userId: string) {
  const prefs = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, userId),
  });
  if (prefs?.selectedVehicleId) {
    const selected = await db.query.vehicles.findFirst({
      where: and(eq(vehicles.id, prefs.selectedVehicleId), eq(vehicles.userId, userId)),
    });
    if (selected) return selected;
  }
  return db.query.vehicles.findFirst({
    where: eq(vehicles.userId, userId),
    orderBy: (fields, { desc }) => desc(fields.createdAt),
  });
}

function toColumns(input: VehicleInput) {
  return {
    plate: input.plate ? normalizePlate(input.plate) : null,
    make: input.make,
    model: input.model,
    year: input.year,
    version: input.version,
    engineDisplacement: input.engineDisplacement,
    fuel: input.fuel,
    hasAirConditioning: input.hasAirConditioning,
    currentKm: input.currentKm,
  };
}

// Cadastro manual (sem consulta de placa — fornecedor ainda é spike, ver
// docs/ROADMAP.md). engine_match_status fica "unmatched" até a curadoria ou
// um fluxo de identificação resolver o motor.
export async function createVehicleForUser(userId: string, input: VehicleInput) {
  const [vehicle] = await db
    .insert(vehicles)
    .values({
      userId,
      ...toColumns(input),
      kmUpdatedAt: input.currentKm != null ? new Date() : null,
    })
    .returning();
  return vehicle;
}

/** Edita os dados e zera a confirmação — dados novos pedem nova conferência. */
export async function updateVehicleForUser(
  userId: string,
  vehicleId: string,
  input: VehicleInput,
  previousKm: number | null,
) {
  const [vehicle] = await db
    .update(vehicles)
    .set({
      ...toColumns(input),
      ...(input.currentKm !== previousKm
        ? { kmUpdatedAt: input.currentKm != null ? new Date() : null }
        : {}),
      confirmedAt: null,
    })
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId)))
    .returning();
  return vehicle;
}

export async function confirmVehicleForUser(userId: string, vehicleId: string) {
  const [vehicle] = await db
    .update(vehicles)
    .set({ confirmedAt: new Date() })
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId)))
    .returning({ id: vehicles.id });
  return vehicle;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(value: string) {
  return UUID_RE.test(value);
}
