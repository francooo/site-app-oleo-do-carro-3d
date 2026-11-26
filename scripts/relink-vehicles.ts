import { isNotNull } from "drizzle-orm";

import { db } from "../lib/db/client";
import { vehicles } from "../lib/db/schema";
import type { FuelType } from "../lib/domain/vehicle";
import { linkVehicleEngine } from "../lib/vehicles/engine-link";

// Uso: pnpm db:relink — rodar depois de `pnpm db:seed` com um motor novo.
// Revincula os carros já confirmados ao catálogo atual: quem estava na fila
// ("unmatched") ganha a ficha do motor recém-curado. Usa a mesma regra do
// cadastro (matchEngine); "manual_override" nunca é tocado.
async function main() {
  const rows = await db.select().from(vehicles).where(isNotNull(vehicles.confirmedAt));
  let changed = 0;
  for (const v of rows) {
    const before = v.engineId;
    const after = await linkVehicleEngine(v.userId, { ...v, fuel: v.fuel as FuelType | null });
    if (after !== before) {
      changed++;
      // Sem placa nem usuário no log: só o carro e o resultado.
      console.log(
        `${v.make} ${v.model} ${v.year}: ${before ?? "sem motor"} → ${after ?? "sem motor"}`,
      );
    }
  }
  console.log(`Revinculados: ${changed} de ${rows.length} carros confirmados.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
