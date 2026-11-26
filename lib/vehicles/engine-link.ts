import { getTrimCandidates } from "@/lib/db/queries/engines";
import { setVehicleEngine } from "@/lib/db/queries/vehicles";
import { matchEngine } from "@/lib/domain/engine-match";
import type { FuelType } from "@/lib/domain/vehicle";

type LinkableVehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  version: string | null;
  engineDisplacement: string | null;
  fuel: FuelType | null;
  engineId: string | null;
  engineMatchStatus: string;
};

/**
 * Vincula o carro ao motor curado (ou desfaz o vínculo se os dados não
 * batem mais). Só roda dentro de Server Actions — nunca durante o render.
 * "manual_override" (curadoria humana) nunca é sobrescrito.
 */
export async function linkVehicleEngine(userId: string, vehicle: LinkableVehicle) {
  if (vehicle.engineMatchStatus === "manual_override") return vehicle.engineId;

  const candidates = await getTrimCandidates(vehicle.make, vehicle.year);
  const result = matchEngine(
    vehicle,
    candidates.map((c) => ({ ...c, fuelType: c.fuelType as FuelType | null })),
  );
  if (result.engineId !== vehicle.engineId || result.status !== vehicle.engineMatchStatus) {
    await setVehicleEngine(userId, vehicle.id, result.engineId, result.status);
  }
  return result.engineId;
}
