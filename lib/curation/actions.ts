"use server";

import type { CurationDraft } from "@/lib/ai/curation-assistant";
import { auth } from "@/lib/auth/auth";
import { type CurationFile, validateCuration } from "@/lib/domain/curation";

import { curationToolEnabled, writeCurationFile } from "./files";

// Server Functions da ferramenta /curadoria. Toda chamada confere ambiente
// (só pnpm dev) e sessão — são alcançáveis por POST direto.

async function guard() {
  if (!curationToolEnabled()) throw new Error("A curadoria só funciona no ambiente local.");
  const session = await auth();
  if (!session?.user) throw new Error("Entre na sua conta para usar a curadoria.");
}

export async function saveCuration(
  c: CurationFile,
): Promise<{ ok: true; file: string } | { ok: false; errors: string[] }> {
  await guard();
  const errors = validateCuration(c);
  if (errors.length > 0) return { ok: false, errors };
  const file = await writeCurationFile(c);
  return { ok: true, file };
}

/**
 * Rascunho dos fluidos a partir do texto do manual (IA). Só sugere: a
 * pessoa confere cada valor com a citação e com a segunda fonte.
 */
export async function draftFluids(
  engineCode: string,
  sourceText: string,
): Promise<{ ok: true; draft: CurationDraft } | { ok: false; error: string }> {
  await guard();
  if (sourceText.trim().length < 40) {
    return { ok: false, error: "Cole o trecho do manual com as tabelas de fluidos e capacidades." };
  }
  if (!process.env.GROQ_API_KEY) {
    return {
      ok: false,
      error: "Configure GROQ_API_KEY no .env.local para usar o rascunho por IA.",
    };
  }
  try {
    // Import sob demanda: lib/ai/groq.ts exige GROQ_API_KEY ao carregar.
    const { draftFluidSpecsFromSource } = await import("@/lib/ai/curation-assistant");
    return { ok: true, draft: await draftFluidSpecsFromSource(engineCode || "motor", sourceText) };
  } catch {
    return { ok: false, error: "A IA não respondeu agora. Tente de novo ou preencha à mão." };
  }
}
