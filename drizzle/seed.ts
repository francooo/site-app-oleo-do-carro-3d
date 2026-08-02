import { db } from "../lib/db/client";
import { componentTypes, fluidTypes } from "../lib/db/schema";

// Tabelas de lookup (PRD seção 7, ajuste v2.2-c) — categorias fixas
// derivadas da seção 5.3 do PRD, não dado de curadoria por motor. Curadoria
// de motores/fluidos/componentes em si acontece por script à parte,
// conforme o Sprint 1 avança (ver docs/ROADMAP.md).

const FLUID_TYPES = [
  { code: "oil", label: "Óleo do motor", displayOrder: 1 },
  { code: "brake", label: "Fluido de freio", displayOrder: 2 },
  { code: "coolant", label: "Arrefecimento", displayOrder: 3 },
  { code: "transmission", label: "Fluido de transmissão", displayOrder: 4 },
  { code: "washer", label: "Fluido do limpador", displayOrder: 5 },
];

const COMPONENT_TYPES = [
  { code: "oil_filter", label: "Filtro de óleo", displayOrder: 1 },
  { code: "air_filter", label: "Filtro de ar", displayOrder: 2 },
  { code: "cabin_filter", label: "Filtro de cabine", displayOrder: 3 },
  { code: "fuel_filter", label: "Filtro de combustível", displayOrder: 4 },
];

async function main() {
  await db.insert(fluidTypes).values(FLUID_TYPES).onConflictDoNothing();
  await db.insert(componentTypes).values(COMPONENT_TYPES).onConflictDoNothing();
  console.log(
    `Seed ok: ${FLUID_TYPES.length} fluid_types, ${COMPONENT_TYPES.length} component_types`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
