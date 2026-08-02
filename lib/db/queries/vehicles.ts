import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { vehicles } from "@/lib/db/schema";

// Toda leitura/escrita de `vehicles` passa por aqui e recebe `userId`
// explicitamente — é essa disciplina que substitui a RLS de banco (ver
// seção 6 do PRD). Nunca faça `db.select().from(vehicles)` direto em uma
// rota ou server action.

export async function getVehiclesByUser(userId: string) {
  return db.query.vehicles.findMany({
    where: eq(vehicles.userId, userId),
    with: { engine: true },
    orderBy: (fields, { desc }) => desc(fields.createdAt),
  });
}

export async function getVehicleByIdForUser(userId: string, vehicleId: string) {
  return db.query.vehicles.findFirst({
    where: and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId)),
    with: { engine: { with: { fluids: true, layout: true } } },
  });
}

export interface CreateVehicleInput {
  plate: string;
  make: string;
  model: string;
  year: number;
  currentKm: number | null;
}

// Cadastro manual (sem consulta de placa — fornecedor ainda é spike do
// Sprint 0, ver docs/ROADMAP.md). engine_match_status fica "unmatched" até
// a curadoria ou um fluxo de identificação resolver o motor.
export async function createVehicleForUser(userId: string, input: CreateVehicleInput) {
  const [vehicle] = await db
    .insert(vehicles)
    .values({
      userId,
      plate: input.plate,
      make: input.make,
      model: input.model,
      year: input.year,
      currentKm: input.currentKm,
      kmUpdatedAt: input.currentKm != null ? new Date() : null,
    })
    .returning();
  return vehicle;
}
