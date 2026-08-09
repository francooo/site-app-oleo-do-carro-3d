import { Car, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonClasses } from "@/components/ui/button-styles";
import { PageHeader } from "@/components/ui/page-header";
import { auth } from "@/lib/auth/auth";
import { getVehiclesByUser } from "@/lib/db/queries/vehicles";

// PRD não tem telemetria (OBD2 é non-goal explícito) — a faixa de status do
// card reflete engine_match_status, o único "status" que de fato existe.
const STATUS_STYLES: Record<string, { stripClass: string; label: string }> = {
  confirmed: { stripClass: "bg-success", label: "Motor identificado" },
  manual_override: { stripClass: "bg-success", label: "Motor identificado" },
  pending_disambiguation: { stripClass: "bg-warning", label: "Confirmar motor" },
  unmatched: { stripClass: "bg-border", label: "Aguardando curadoria" },
};

const km = new Intl.NumberFormat("pt-BR");

export default async function GaragemPage() {
  const session = await auth();
  // O guard de sessão do layout (app)/layout.tsx não garante que esta page
  // nunca rode com sessão nula: em dev, layout e page podem renderizar em
  // paralelo, e a page chega a executar antes do redirect() do layout
  // surtir efeito. Checagem redundante aqui evita um TypeError descartado
  // (o response final já saía correto, mas com erro ruidoso no log).
  if (!session?.user) {
    redirect("/login");
  }
  const vehicles = await getVehiclesByUser(session.user.id);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="Sua garagem"
        actions={
          <Link href="/veiculos/novo" className={buttonClasses("primary")}>
            Adicionar
          </Link>
        }
      />
      <p className="mb-6 text-sm text-foreground-muted">
        Gerencie os veículos cadastrados na sua garagem.
      </p>

      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {vehicles.map((vehicle) => {
          const status = STATUS_STYLES[vehicle.engineMatchStatus] ?? STATUS_STYLES.unmatched;
          return (
            <li key={vehicle.id} className="relative">
              <Link
                href={`/veiculos/${vehicle.id}`}
                className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-border/60 bg-surface p-6 pl-7 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-0 left-0 w-1 ${status.stripClass}`}
                />

                <div>
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <p className="mt-1 text-xs text-foreground-muted">
                    Placa {vehicle.plate} · {vehicle.year}
                  </p>
                </div>

                <div className="flex h-24 items-center justify-center rounded-xl bg-background text-foreground-muted/40">
                  <Car className="h-10 w-10" strokeWidth={1.5} aria-hidden="true" />
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-border/30 pt-4 text-xs">
                  <span className="text-foreground-muted">{status.label}</span>
                  {vehicle.currentKm != null ? (
                    <span className="font-mono text-foreground">{km.format(vehicle.currentKm)} km</span>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}

        <li>
          <Link
            href="/veiculos/novo"
            className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border p-6 text-center transition-colors hover:border-accent hover:bg-accent/5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent-text">
              <Plus className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
            </div>
            <p className="font-heading font-semibold text-foreground">
              {vehicles.length === 0 ? "Adicione seu primeiro veículo" : "Adicionar outro veículo"}
            </p>
            <p className="max-w-[220px] text-sm text-foreground-muted">
              Cadastro por placa (PRD seção 5.2) chega no Sprint 1 — por ora, use o cadastro
              manual.
            </p>
          </Link>
        </li>
      </ul>
    </div>
  );
}
