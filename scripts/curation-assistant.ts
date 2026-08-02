import { readFileSync } from "node:fs";

import { draftFluidSpecsFromSource } from "../lib/ai/curation-assistant";

// Uso: pnpm curate <codigo-do-motor> <arquivo-de-texto-fonte>
// Saída: rascunho estruturado para revisão manual — nunca vai direto pro
// banco (ver seção 6 do PRD: IA não é fonte de verdade sobre especificação;
// mínimo de duas fontes independentes e checagem humana antes de publicar).
async function main() {
  const [engineCode, filePath] = process.argv.slice(2);
  if (!engineCode || !filePath) {
    console.error("Uso: pnpm curate <codigo-do-motor> <arquivo-de-texto-fonte>");
    process.exit(1);
  }

  const sourceText = readFileSync(filePath, "utf-8");
  const draft = await draftFluidSpecsFromSource(engineCode, sourceText);

  console.log(JSON.stringify(draft, null, 2));

  if (draft.uncertain.length > 0) {
    console.log("\n⚠ Pontos incertos — confira manualmente antes de publicar:");
    for (const note of draft.uncertain) {
      console.log(`  - ${note}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
