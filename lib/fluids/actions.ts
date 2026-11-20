"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { createFluidCheck } from "@/lib/db/queries/maintenance";
import { bumpVehicleKm, getVehicleByIdForUser } from "@/lib/db/queries/vehicles";
import { CHECK_RESULT_LABEL, type CheckResult } from "@/lib/domain/fluid-status";
import { fluidLabel, isTrackedFluid } from "@/lib/domain/fluids";

export type CheckActionState = { error?: string } | undefined;

const RESULTS = Object.keys(CHECK_RESULT_LABEL) as CheckResult[];

/** "Registrar verificação" — fim do tutorial (tela 05) e "Atualizar status" (06). */
export async function registerFluidCheck(
  vehicleId: string,
  fluidCode: string,
  _prev: CheckActionState,
  formData: FormData,
): Promise<CheckActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };
  if (!isTrackedFluid(fluidCode)) return { error: "Fluido inválido." };

  const vehicle = await getVehicleByIdForUser(session.user.id, vehicleId);
  if (!vehicle) return { error: "Veículo não encontrado." };

  const result = String(formData.get("result") ?? "");
  if (!(RESULTS as string[]).includes(result)) {
    return { error: "Escolha como estava o nível." };
  }

  const kmRaw = String(formData.get("km") ?? "")
    .trim()
    .replace(/\./g, "");
  let km: number | null = null;
  if (kmRaw) {
    km = Number(kmRaw);
    if (!Number.isInteger(km) || km < 0 || km > 2_000_000) {
      return { error: "Quilometragem inválida." };
    }
  }

  await createFluidCheck(vehicle.id, {
    fluidType: fluidCode,
    fluidLabel: fluidLabel(fluidCode),
    checkResult: result as CheckResult,
    km,
  });
  if (km != null) await bumpVehicleKm(session.user.id, vehicle.id, km);

  revalidatePath("/", "layout");
  redirect(`/veiculos/${vehicle.id}/status?registrado=${fluidCode}`);
}
