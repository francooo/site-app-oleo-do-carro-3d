import { desc, eq, and } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { curations } from "@/lib/db/schema";
import type { CurationFile } from "@/lib/domain/curation";

// Curadoria online: catálogo editorial, não dado de usuário (sem userId).
// Escrita só pelas Server Functions de /curadoria, que conferem o curador.

export type CurationRow = {
  layoutCode: string;
  status: "draft" | "published";
  hasUnpublishedChanges: boolean;
  data: CurationFile;
  updatedByEmail: string | null;
  publishedByEmail: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
};

export async function listCurations(): Promise<CurationRow[]> {
  const rows = await db.select().from(curations).orderBy(desc(curations.updatedAt));
  return rows.map((r) => ({
    layoutCode: r.layoutCode,
    status: r.status,
    hasUnpublishedChanges: r.hasUnpublishedChanges,
    data: r.data as CurationFile,
    updatedByEmail: r.updatedByEmail,
    publishedByEmail: r.publishedByEmail,
    publishedAt: r.publishedAt,
    updatedAt: r.updatedAt,
  }));
}

/** Salva o rascunho (cria ou atualiza pelo código do layout). */
export async function saveCurationDraft(c: CurationFile, email: string) {
  const now = new Date();
  await db
    .insert(curations)
    .values({ layoutCode: c.layout.code, data: c, updatedByEmail: email, updatedAt: now })
    .onConflictDoUpdate({
      target: curations.layoutCode,
      set: { data: c, hasUnpublishedChanges: true, updatedByEmail: email, updatedAt: now },
    });
}

export async function markCurationPublished(c: CurationFile, email: string) {
  const now = new Date();
  await db
    .update(curations)
    .set({
      status: "published",
      data: c,
      publishedData: c,
      hasUnpublishedChanges: false,
      publishedByEmail: email,
      publishedAt: now,
      updatedAt: now,
    })
    .where(eq(curations.layoutCode, c.layout.code));
}

/** Versão publicada do layout — é o que o mapa dos usuários desenha. */
export async function getPublishedCuration(layoutCode: string): Promise<CurationFile | null> {
  const [row] = await db
    .select({ publishedData: curations.publishedData })
    .from(curations)
    .where(and(eq(curations.layoutCode, layoutCode), eq(curations.status, "published")))
    .limit(1);
  return (row?.publishedData as CurationFile | undefined) ?? null;
}

export async function listPublishedCurations(): Promise<CurationFile[]> {
  const rows = await db
    .select({ publishedData: curations.publishedData })
    .from(curations)
    .where(eq(curations.status, "published"));
  return rows.map((r) => r.publishedData as CurationFile).filter(Boolean);
}

/** Bootstrap do seed: grava um arquivo do repositório como publicado, se ainda não existir. */
export async function insertPublishedCurationIfMissing(c: CurationFile) {
  await db
    .insert(curations)
    .values({
      layoutCode: c.layout.code,
      data: c,
      publishedData: c,
      status: "published",
      hasUnpublishedChanges: false,
      updatedByEmail: "seed",
      publishedByEmail: "seed",
      publishedAt: new Date(),
    })
    .onConflictDoNothing({ target: curations.layoutCode });
}
