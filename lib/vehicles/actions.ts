"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { createVehicleForUser } from "@/lib/db/queries/vehicles";
import { isValidPlateFormat, normalizePlate } from "@/lib/plate";

export type ActionState = { error?: string } | undefined;

const UNIQUE_VIOLATION = "23505";

export async function createVehicle(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const plateRaw = String(formData.get("plate") ?? "");
  const make = String(formData.get("make") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const year = Number(formData.get("year"));
  const currentKmRaw = formData.get("currentKm");
  const currentKm = currentKmRaw ? Number(currentKmRaw) : null;

  if (!isValidPlateFormat(plateRaw)) {
    return { error: "Placa inválida. Use o formato antigo (ABC1234) ou Mercosul (ABC1D23)." };
  }
  if (!make || !model) {
    return { error: "Marca e modelo são obrigatórios." };
  }
  if (!Number.isInteger(year) || year < 1950 || year > new Date().getFullYear() + 1) {
    return { error: "Ano inválido." };
  }
  if (currentKm !== null && (!Number.isFinite(currentKm) || currentKm < 0)) {
    return { error: "Quilometragem inválida." };
  }

  let vehicleId: string;
  try {
    const vehicle = await createVehicleForUser(session.user.id, {
      plate: normalizePlate(plateRaw),
      make,
      model,
      year,
      currentKm,
    });
    vehicleId = vehicle.id;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === UNIQUE_VIOLATION) {
      return { error: "Você já tem um veículo com essa placa cadastrado." };
    }
    throw error;
  }

  redirect(`/veiculos/${vehicleId}`);
}
