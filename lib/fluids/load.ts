import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { getVehicleByIdForUser } from "@/lib/db/queries/vehicles";

import { getVehicleFluidOverview } from "./vehicle-fluids";
import { buildFluidViews } from "./view";

/**
 * Carga comum das telas técnicas do carro (mapa, detalhe, tutorial, status):
 * sessão, posse do veículo, confirmação obrigatória (regra §4) e fluidos.
 */
export async function loadVehicleFluids(vehicleId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const vehicle = await getVehicleByIdForUser(session.user.id, vehicleId);
  if (!vehicle) notFound();
  if (!vehicle.confirmedAt) redirect(`/veiculos/${vehicle.id}/confirmar`);

  const { sheet, statuses } = await getVehicleFluidOverview(session.user.id, vehicle);
  const fluids = await buildFluidViews(vehicle, sheet, statuses);
  return { vehicle, sheet, fluids };
}
