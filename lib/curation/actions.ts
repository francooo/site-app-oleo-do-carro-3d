"use server";

import { revalidatePath } from "next/cache";

import type { CurationDraft } from "@/lib/ai/curation-assistant";
import { getCuratorSession } from "@/lib/auth/curator";
import { engineDefFromCuration, upsertEngineCatalog } from "@/lib/catalog/engine-catalog";
import { relinkAllVehicles } from "@/lib/catalog/relink";
import { markCurationPublished, saveCurationDraft } from "@/lib/db/queries/curations";
import { type CurationFile, validateCuration } from "@/lib/domain/curation";

// Server Functions da curadoria online. Alcançáveis por POST direto: toda
// chamada confere se a sessão é de um curador (CURATOR_EMAILS).

async function requireCurator() {
  const curator = await getCuratorSession();
  if (!curator) throw new Error("Acesso restrito à equipe de curadoria.");
  return curator;
}

const CODE = /^[a-z0-9]+(-[a-z0-9.]+)*$/;

/** Rascunho: salva mesmo incompleto; não aparece para ninguém. */
export async function saveDraft(
  c: CurationFile,
): Promise<{ ok: true; pending: string[] } | { ok: false; error: string }> {
  const { email } = await requireCurator();
  if (!CODE.test(c.layout.code)) {
    return { ok: false, error: "Defina o código do layout antes de salvar (ex.: vw-gol-g6)." };
  }
  await saveCurationDraft(c, email);
  revalidatePath("/curadoria");
  return { ok: true, pending: validateCuration(c) };
}

/**
 * Publica: valida, grava o catálogo (motor, fluidos, layout, pontos,
 * modelos) e vincula os carros que estavam na fila. Vale na hora.
 */
export async function publish(
  c: CurationFile,
): Promise<{ ok: true; linked: string[] } | { ok: false; errors: string[] }> {
  const { email } = await requireCurator();
  const errors = validateCuration(c);
  if (errors.length > 0) return { ok: false, errors };

  await saveCurationDraft(c, email);
  await upsertEngineCatalog(engineDefFromCuration(c));
  await markCurationPublished(c, email);
  const { changes } = await relinkAllVehicles();
  revalidatePath("/", "layout");
  return { ok: true, linked: changes.map((ch) => ch.car) };
}

/**
 * Rascunho dos fluidos a partir do texto do manual (IA). Só sugere: a
 * pessoa confere cada valor com a citação e com a segunda fonte.
 */
export async function draftFluids(
  engineCode: string,
  sourceText: string,
): Promise<{ ok: true; draft: CurationDraft } | { ok: false; error: string }> {
  await requireCurator();
  if (sourceText.trim().length < 40) {
    return { ok: false, error: "Cole o trecho do manual com as tabelas de fluidos e capacidades." };
  }
  if (!process.env.GROQ_API_KEY) {
    return { ok: false, error: "Rascunho por IA indisponível: falta GROQ_API_KEY no servidor." };
  }
  try {
    // Import sob demanda: lib/ai/groq.ts exige GROQ_API_KEY ao carregar.
    const { draftFluidSpecsFromSource } = await import("@/lib/ai/curation-assistant");
    return { ok: true, draft: await draftFluidSpecsFromSource(engineCode || "motor", sourceText) };
  } catch {
    return { ok: false, error: "A IA não respondeu agora. Tente de novo ou preencha à mão." };
  }
}
