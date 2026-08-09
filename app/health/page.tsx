import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { getCatalogStats } from "@/lib/db/queries/engines";

// docs/ROADMAP.md — meta do MVP inicial (10-15 motores curados).
const MVP_ENGINE_TARGET = 15;

const INTEGRATION_CHECKS = [
  {
    name: "Login Google",
    configured: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  },
  {
    name: "Storage (Neon Object Storage)",
    configured: Boolean(process.env.NEON_STORAGE_ENDPOINT),
  },
  { name: "IA (Groq)", configured: Boolean(process.env.GROQ_API_KEY) },
  // Sempre pendente por enquanto — decisão de fornecedor é spike do Sprint 0
  // (ver lib/plate-lookup/provider.ts e docs/ROADMAP.md).
  { name: "Consulta de placa", configured: false },
];

// Função auxiliar separada (não o corpo do componente) porque `Date.now()`
// direto num Server Component dispara a regra de lint `react-hooks/purity`
// (chamada impura durante "render").
async function checkDatabaseHealth() {
  const start = Date.now();
  try {
    const stats = await getCatalogStats();
    return { stats, latencyMs: Date.now() - start, error: null as string | null };
  } catch (error) {
    return {
      stats: { engines: 0, fluidTypes: 0, componentTypes: 0 },
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

// Ferramenta interna de diagnóstico — protegida por login (o próprio banner
// abaixo explica o porquê). Sem valor de produto pro usuário final; ver
// docs/ROADMAP.md sobre restringir mais ou remover antes do beta fechado.
//
// Força renderização dinâmica: sem isso o Next tenta pré-renderizar a
// página no build (SSG) e falha, porque o build não tem (nem deveria ter)
// uma conexão real com o banco.
export const dynamic = "force-dynamic";

export default async function HealthPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { stats, latencyMs: dbLatencyMs, error: dbError } = await checkDatabaseHealth();

  return (
    <div className="relative min-h-full flex-1">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px]"
      />

      <div className="relative mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          <span aria-hidden="true">⚠</span>
          <span>
            Ferramenta interna de diagnóstico — será protegida com mais rigor ou removida antes
            do beta fechado (Sprint 3, ver docs/ROADMAP.md).
          </span>
        </div>

        <h1 className="font-heading text-xl font-bold text-foreground">Saúde do sistema</h1>
        <p className="mt-1 mb-6 text-sm text-foreground-muted">
          Estado real da infraestrutura — nenhum dado nesta página é simulado.
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-6">
            <span
              aria-hidden="true"
              className={`absolute inset-y-0 left-0 w-1 ${dbError ? "bg-error" : "bg-success"}`}
            />
            <p className="text-xs font-semibold tracking-wide text-foreground-muted uppercase">
              Banco de dados
            </p>
            <p
              className={`mt-3 font-heading text-2xl font-bold ${dbError ? "text-error" : "text-success"}`}
            >
              {dbError ? "Erro" : "Conectado"}
            </p>
            <dl className="mt-4 flex flex-col gap-2 border-t border-border/50 pt-4 text-xs">
              <div className="flex justify-between">
                <dt className="text-foreground-muted">Driver</dt>
                <dd className="font-mono text-foreground">@neondatabase/serverless</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground-muted">Latência</dt>
                <dd className="font-mono text-foreground">{dbLatencyMs}ms</dd>
              </div>
            </dl>
            {dbError ? <p className="mt-3 text-xs text-error">{dbError}</p> : null}
          </div>

          <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-6">
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-accent" />
            <p className="text-xs font-semibold tracking-wide text-foreground-muted uppercase">
              Catálogo curado
            </p>
            <p className="mt-3 font-heading text-2xl font-bold text-foreground">
              {stats.engines}
              <span className="text-base font-normal text-foreground-muted">
                /{MVP_ENGINE_TARGET} motores
              </span>
            </p>
            <dl className="mt-4 flex flex-col gap-2 border-t border-border/50 pt-4 text-xs">
              <div className="flex justify-between">
                <dt className="text-foreground-muted">Tipos de fluido</dt>
                <dd className="font-mono text-foreground">{stats.fluidTypes}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground-muted">Tipos de componente</dt>
                <dd className="font-mono text-foreground">{stats.componentTypes}</dd>
              </div>
            </dl>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-6">
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-accent" />
            <p className="mb-4 text-xs font-semibold tracking-wide text-foreground-muted uppercase">
              Integrações
            </p>
            <ul className="flex flex-col gap-3 text-xs">
              {INTEGRATION_CHECKS.map((check) => (
                <li key={check.name} className="flex items-center justify-between gap-2">
                  <span className="text-foreground">{check.name}</span>
                  <span className={check.configured ? "text-success" : "text-warning"}>
                    {check.configured ? "Configurado" : "Pendente"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
