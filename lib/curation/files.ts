import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CurationFile } from "@/lib/domain/curation";

// Leitura e escrita dos arquivos de curadoria no disco do repositório. Só
// faz sentido no computador de quem cura (pnpm dev): na Vercel o disco é
// somente leitura e a página /curadoria nem existe.

const DIR = path.join(process.cwd(), "content", "curadoria");
const CODE = /^[a-z0-9]+(-[a-z0-9.]+)*$/;

export function curationToolEnabled() {
  return process.env.NODE_ENV === "development";
}

export async function listCurationFiles(): Promise<CurationFile[]> {
  const names = (await readdir(DIR)).filter((n) => n.endsWith(".json")).sort();
  return Promise.all(
    names.map(async (n) => JSON.parse(await readFile(path.join(DIR, n), "utf-8")) as CurationFile),
  );
}

/** Grava o JSON do layout e regenera content/curadoria/index.ts. */
export async function writeCurationFile(c: CurationFile) {
  // O nome do arquivo vem do código validado: nada de "../" no caminho.
  if (!CODE.test(c.layout.code)) throw new Error("Código de layout inválido.");
  const file = path.join(DIR, `${c.layout.code}.json`);
  await writeFile(file, `${JSON.stringify(c, null, 2)}\n`, "utf-8");
  await writeIndex();
  return path.relative(process.cwd(), file);
}

async function writeIndex() {
  const names = (await readdir(DIR)).filter((n) => n.endsWith(".json")).sort();
  const imports = names.map((n, i) => `import c${i} from "./${n}";`).join("\n");
  const list = names.map((_n, i) => `c${i} as CurationFile`).join(", ");
  const src = `// GERADO pela ferramenta /curadoria (lib/curation/files.ts) — não edite à mão.
// Um import por arquivo de curadoria desta pasta.

import type { CurationFile } from "@/lib/domain/curation";

${imports}

export const CURATIONS: readonly CurationFile[] = [${list}];
`;
  await writeFile(path.join(DIR, "index.ts"), src, "utf-8");
}
