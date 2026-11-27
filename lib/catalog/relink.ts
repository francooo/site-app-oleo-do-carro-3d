import { isNotNull } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { vehicles } from "@/lib/db/schema";
import type { FuelType } from "@/lib/domain/vehicle";
import { linkVehicleEngine } from "@/lib/vehicles/engine-link";

/**
 * Revincula os carros confirmados ao catálogo atual — quem estava na fila
 * ("unmatched") ganha a ficha do motor recém-publicado. Mesma regra do
 * cadastro (matchEngine); "manual_override" nunca é tocado. Percorre todos
 * os usuários: só roda no seed e na publicação da curadoria (administrador).
 */
export async function relinkAllVehicles() {
  const rows = await db.select().from(vehicles).where(isNotNull(vehicles.confirmedAt));
  const changes: { car: string; from: string | null; to: string | null }[] = [];
  for (const v of rows) {
    const after = await linkVehicleEngine(v.userId, { ...v, fuel: v.fuel as FuelType | null });
    if (after !== v.engineId) {
      changes.push({ car: `${v.make} ${v.model} ${v.year}`, from: v.engineId, to: after });
    }
  }
  return { checked: rows.length, changes };
}
