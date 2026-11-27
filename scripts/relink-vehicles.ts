import { relinkAllVehicles } from "../lib/catalog/relink";

// Uso: pnpm db:relink — mesma revinculação do botão "Publicar" da curadoria.
async function main() {
  const { checked, changes } = await relinkAllVehicles();
  // Sem placa nem usuário no log: só o carro e o resultado.
  for (const c of changes)
    console.log(`${c.car}: ${c.from ?? "sem motor"} → ${c.to ?? "sem motor"}`);
  console.log(`Revinculados: ${changes.length} de ${checked} carros confirmados.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
