"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { getLookupForUser, rowToPlateVehicle } from "@/lib/db/queries/plate-lookups";
import { setSelectedVehicle } from "@/lib/db/queries/preferences";
import { createVehicleFromPlateForUser } from "@/lib/db/queries/vehicles";
import { displacementFromName, pickFipeVersion } from "@/lib/domain/plate-vehicle";
import { lookupPlateForUser } from "@/lib/plate-lookup/service";
import type { ActionState } from "@/lib/vehicles/actions";
import { linkVehicleEngine } from "@/lib/vehicles/engine-link";

// Server Actions são alcançáveis por POST direto: cada uma reconfere sessão.

const MANUAL_REASON = {
  not_found: "nao_encontrada",
  unavailable: "indisponivel",
  limit: "limite",
  not_configured: "indisponivel",
} as const;

/** Tela "Qual é a placa?" → consulta → "É este carro?" ou cadastro manual. */
export async function lookupPlate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };

  const raw = formData.get("plate");
  const result = await lookupPlateForUser(session.user.id, typeof raw === "string" ? raw : "");

  if (result.status === "invalid") {
    return {
      error: "Placa inválida. Use o formato antigo (ABC1234) ou Mercosul (ABC1D23).",
    };
  }
  if (result.status === "found") redirect(`/veiculos/novo/placa/${result.lookupId}`);

  const params = new URLSearchParams({
    placa: result.plate,
    motivo: MANUAL_REASON[result.status],
  });
  redirect(`/veiculos/novo/manual?${params}`);
}

const UNIQUE_VIOLATION = "23505";

/** "Sim, é o meu carro": cria o veículo já confirmado e abre o mapa. */
export async function createVehicleFromLookup(
  lookupId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };

  const row = await getLookupForUser(lookupId, session.user.id);
  const plateVehicle = row ? rowToPlateVehicle(row) : null;
  if (!row || !plateVehicle) return { error: "Consulta não encontrada. Busque a placa de novo." };
  if (!plateVehicle.modelYear) {
    return {
      error: "A consulta não trouxe o ano do carro. Use o cadastro manual.",
    };
  }

  // Versão: a escolhida pelo usuário (quando havia opções) ou a mais provável.
  const choice = pickFipeVersion({
    versions: plateVehicle.fipeVersions,
    engineDisplacement: plateVehicle.engineDisplacement,
  });
  const chosenCode = formData.get("fipeCode");
  const chosen =
    plateVehicle.fipeVersions.find((v) => v.code === chosenCode) ?? choice.chosen ?? null;

  const kmRaw = String(formData.get("currentKm") ?? "")
    .replace(/\./g, "")
    .trim();
  const currentKm = kmRaw ? Number(kmRaw) : null;
  if (
    currentKm != null &&
    (!Number.isInteger(currentKm) || currentKm < 0 || currentKm > 2_000_000)
  ) {
    return { error: "Quilometragem inválida." };
  }
  const ac = formData.get("hasAirConditioning");

  const version = chosen?.name || plateVehicle.version;
  let vehicleId: string;
  try {
    const vehicle = await createVehicleFromPlateForUser(session.user.id, {
      plate: plateVehicle.plate,
      make: plateVehicle.make,
      model: plateVehicle.model,
      year: plateVehicle.modelYear,
      version: version ? version.slice(0, 60) : null,
      engineDisplacement: displacementFromName(chosen?.name) ?? plateVehicle.engineDisplacement,
      fuel: chosen?.fuel ?? plateVehicle.fuel,
      hasAirConditioning: ac === "sim" ? true : ac === "nao" ? false : null,
      currentKm,
      fipeCode: chosen?.code ?? plateVehicle.fipeCode,
      plateLookupId: row.id,
    });
    vehicleId = vehicle!.id;
    await linkVehicleEngine(session.user.id, vehicle!);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === UNIQUE_VIOLATION) {
      return { error: "Você já tem um veículo com essa placa cadastrado." };
    }
    throw error;
  }

  await setSelectedVehicle(session.user.id, vehicleId);
  revalidatePath("/", "layout");
  redirect(`/veiculos/${vehicleId}/mapa`);
}
