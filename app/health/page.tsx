import { listEngines } from "@/lib/db/queries/engines";

// Página de verificação do scaffold: prova que um Server Component consegue
// ler o banco via Drizzle + Neon. Sem valor de produto — remover ou
// proteger antes do beta fechado (Sprint 3).
//
// Força renderização dinâmica: sem isso o Next tenta pré-renderizar a
// página no build (SSG) e falha, porque o build não tem (nem deveria ter)
// uma conexão real com o banco.
export const dynamic = "force-dynamic";

export default async function HealthPage() {
  const engines = await listEngines();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="text-xl font-semibold">Health check</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {engines.length} motor(es) no catálogo curado (lido via Drizzle + Neon).
      </p>
      <ul className="mt-4 flex flex-col gap-1 text-sm">
        {engines.map((engine) => (
          <li key={engine.id}>{engine.code}</li>
        ))}
      </ul>
    </div>
  );
}
