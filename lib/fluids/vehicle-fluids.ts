import { type EngineSheet, getEngineSheet } from "@/lib/db/queries/engines";
import { getFluidEventsForUser } from "@/lib/db/queries/maintenance";
import type { Vehicle } from "@/lib/db/queries/vehicles";
import { type FluidIntervals, statusForFluids } from "@/lib/domain/fluid-status";
import { TRACKED_FLUIDS } from "@/lib/domain/fluids";

// Junta catálogo curado + registros do usuário num formato pronto para as
// telas técnicas (mapa, detalhe, tutorial, status, Início, garagem).

export function intervalsFromSheet(sheet: EngineSheet | null | undefined) {
  const map: Partial<Record<string, FluidIntervals>> = {};
  for (const f of sheet?.fluids ?? []) {
    map[f.fluidType] = {
      intervalKm: f.intervalKm,
      intervalMonths: f.intervalMonths,
      checkIntervalKm: f.checkIntervalKm,
    };
  }
  return map;
}

const TRACKED_CODES = TRACKED_FLUIDS.map((f) => f.code);

/** Ficha do motor (se houver curadoria) + status por fluido de um veículo. */
export async function getVehicleFluidOverview(userId: string, vehicle: Vehicle) {
  const [sheet, events] = await Promise.all([
    vehicle.engineId ? getEngineSheet(vehicle.engineId) : Promise.resolve(undefined),
    getFluidEventsForUser(userId, [vehicle.id]),
  ]);
  const statuses = statusForFluids(
    TRACKED_CODES,
    events,
    intervalsFromSheet(sheet),
    vehicle.currentKm,
  );
  return { sheet: sheet ?? null, statuses };
}

/** Status de todos os carros do usuário (garagem). */
export async function getFluidStatusesForVehicles(userId: string, list: Vehicle[]) {
  const engineIds = [...new Set(list.map((v) => v.engineId).filter((id): id is string => !!id))];
  const [sheets, events] = await Promise.all([
    Promise.all(engineIds.map((id) => getEngineSheet(id))),
    getFluidEventsForUser(
      userId,
      list.map((v) => v.id),
    ),
  ]);
  const sheetById = new Map(sheets.filter(Boolean).map((s) => [s!.id, s!]));
  return new Map(
    list.map((v) => [
      v.id,
      statusForFluids(
        TRACKED_CODES,
        events.filter((e) => e.vehicleId === v.id),
        intervalsFromSheet(v.engineId ? sheetById.get(v.engineId) : null),
        v.currentKm,
      ),
    ]),
  );
}
