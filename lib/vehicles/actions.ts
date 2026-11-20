"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { setSelectedVehicle } from "@/lib/db/queries/preferences";
import {
  confirmVehicleForUser,
  createVehicleForUser,
  getVehicleByIdForUser,
  updateVehicleForUser,
} from "@/lib/db/queries/vehicles";
import { parseVehicleInput } from "@/lib/domain/vehicle";
import { isValidPlateFormat } from "@/lib/plate";

// Server Actions são alcançáveis por POST direto (docs Next 16, "Mutating
// Data"): toda action revalida sessão e posse do veículo por conta própria.

export type ActionState = { error?: string } | undefined;

const UNIQUE_VIOLATION = "23505";

function parseForm(formData: FormData) {
  const parsed = parseVehicleInput((key) => formData.get(key));
  if (parsed.ok && parsed.data.plate && !isValidPlateFormat(parsed.data.plate)) {
    return {
      ok: false as const,
      error: "Placa inválida. Use o formato antigo (ABC1234) ou Mercosul (ABC1D23).",
    };
  }
  return parsed;
}

function isUniqueViolation(error: unknown) {
  return !!error && typeof error === "object" && "code" in error && error.code === UNIQUE_VIOLATION;
}

export async function createVehicle(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };

  const parsed = parseForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  let vehicleId: string;
  try {
    const vehicle = await createVehicleForUser(session.user.id, parsed.data);
    vehicleId = vehicle.id;
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: "Você já tem um veículo com essa placa cadastrado." };
    }
    throw error;
  }

  revalidatePath("/garagem");
  redirect(`/veiculos/${vehicleId}/confirmar`);
}

export async function updateVehicle(
  vehicleId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };

  const current = await getVehicleByIdForUser(session.user.id, vehicleId);
  if (!current) return { error: "Veículo não encontrado." };

  const parsed = parseForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  try {
    await updateVehicleForUser(session.user.id, vehicleId, parsed.data, current.currentKm);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: "Você já tem outro veículo com essa placa cadastrado." };
    }
    throw error;
  }

  revalidatePath("/", "layout");
  redirect(`/veiculos/${vehicleId}/confirmar`);
}

/** "Confirmar veículo" (tela 03): marca como conferido e já seleciona o carro. */
export async function confirmVehicle(vehicleId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const confirmed = await confirmVehicleForUser(session.user.id, vehicleId);
  if (!confirmed) redirect("/garagem");

  await setSelectedVehicle(session.user.id, vehicleId);
  revalidatePath("/", "layout");
  redirect("/inicio");
}

/**
 * Seleciona o carro (garagem → card) e segue para o destino. Carros ainda não
 * conferidos passam primeiro pela confirmação.
 */
export async function selectVehicle(vehicleId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const vehicle = await getVehicleByIdForUser(session.user.id, vehicleId);
  if (!vehicle) redirect("/garagem");

  await setSelectedVehicle(session.user.id, vehicle.id);
  revalidatePath("/", "layout");
  redirect(vehicle.confirmedAt ? "/inicio" : `/veiculos/${vehicle.id}/confirmar`);
}
