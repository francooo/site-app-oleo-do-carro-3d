import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { maintenanceRecords, vehicles } from "@/lib/db/schema";
import type { CheckResult, FluidEvent } from "@/lib/domain/fluid-status";

// Registros de manutenção são dado de usuário: toda consulta passa pelo join
// com `vehicles` filtrando `userId` (mesma disciplina de queries/vehicles.ts).

const FLUID_KINDS = ["verificacao", "complemento", "troca"] as const;

export type VehicleFluidEvent = FluidEvent & { vehicleId: string; fluidType: string };

/** Eventos de fluido (verificação/complemento/troca), mais recentes primeiro. */
export async function getFluidEventsForUser(
  userId: string,
  vehicleIds?: string[],
): Promise<VehicleFluidEvent[]> {
  if (vehicleIds && vehicleIds.length === 0) return [];
  const rows = await db
    .select({
      vehicleId: maintenanceRecords.vehicleId,
      fluidType: maintenanceRecords.fluidType,
      date: maintenanceRecords.date,
      km: maintenanceRecords.km,
      kind: maintenanceRecords.kind,
      checkResult: maintenanceRecords.checkResult,
    })
    .from(maintenanceRecords)
    .innerJoin(vehicles, eq(vehicles.id, maintenanceRecords.vehicleId))
    .where(
      and(
        eq(vehicles.userId, userId),
        isNotNull(maintenanceRecords.fluidType),
        inArray(maintenanceRecords.kind, [...FLUID_KINDS]),
        vehicleIds ? inArray(maintenanceRecords.vehicleId, vehicleIds) : undefined,
      ),
    )
    .orderBy(desc(maintenanceRecords.date), desc(maintenanceRecords.createdAt));

  return rows.map((r) => ({
    vehicleId: r.vehicleId,
    fluidType: r.fluidType!,
    date: r.date,
    km: r.km,
    kind: r.kind as FluidEvent["kind"],
    checkResult: r.checkResult,
  }));
}

export type NewFluidCheck = {
  fluidType: string;
  fluidLabel: string;
  checkResult: CheckResult;
  km: number | null;
};

/**
 * Registra uma verificação de nível. Quem chama DEVE ter verificado a posse
 * do veículo (getVehicleByIdForUser) — aqui só gravamos.
 */
export async function createFluidCheck(vehicleId: string, input: NewFluidCheck) {
  const [record] = await db
    .insert(maintenanceRecords)
    .values({
      vehicleId,
      date: new Date(),
      km: input.km,
      kind: input.checkResult === "baixo_completei" ? "complemento" : "verificacao",
      fluidType: input.fluidType,
      checkResult: input.checkResult,
      serviceType: `Verificação de nível — ${input.fluidLabel}`,
    })
    .returning({ id: maintenanceRecords.id });
  return record;
}
