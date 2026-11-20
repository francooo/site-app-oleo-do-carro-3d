import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { userPreferences } from "@/lib/db/schema";

// Preferências 1:1 com o usuário. A linha só passa a existir na primeira
// escrita (upsert) — leituras tratam ausência como "valores padrão".

export async function getPreferences(userId: string) {
  return db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, userId),
  });
}

/**
 * Grava o carro selecionado. Quem chama DEVE ter verificado que o veículo
 * pertence ao usuário (getVehicleByIdForUser) — a FK só garante que existe.
 */
export async function setSelectedVehicle(userId: string, vehicleId: string) {
  await db
    .insert(userPreferences)
    .values({ userId, selectedVehicleId: vehicleId })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { selectedVehicleId: vehicleId, updatedAt: new Date() },
    });
}
