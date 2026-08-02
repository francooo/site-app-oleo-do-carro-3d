import { db } from "@/lib/db/client";

// Catálogo curado: somente leitura para o app. Escrita acontece via script
// de curadoria com a connection string direta (ver seção 6 do PRD).

export async function listEngines() {
  return db.query.engines.findMany({
    with: { layout: true },
    orderBy: (fields, { asc }) => asc(fields.code),
  });
}

export async function countEngines() {
  const rows = await db.query.engines.findMany({ columns: { id: true } });
  return rows.length;
}
