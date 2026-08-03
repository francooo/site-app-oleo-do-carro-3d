import { Car, Settings } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonClasses } from "@/components/ui/button-styles";
import { auth } from "@/lib/auth/auth";
import { getVehiclesByUser } from "@/lib/db/queries/vehicles";

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
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
          Sua garagem
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/configuracoes"
            aria-label="Configurações"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-foreground-muted transition-colors active:bg-accent-soft active:text-accent-text"
          >
            <Settings className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </Link>
          <Link href="/veiculos/novo" className={buttonClasses("primary")}>
            Adicionar
          </Link>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          Nenhum veículo cadastrado ainda. Cadastro por placa (PRD seção 5.2) chega no Sprint 1 —
          por ora, use o cadastro manual.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {vehicles.map((vehicle) => (
            <li key={vehicle.id}>
              <Link
                href={`/veiculos/${vehicle.id}`}
                className="group flex min-h-11 items-center gap-4 rounded-xl border border-border/60 bg-surface px-4 py-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] active:translate-y-0"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Car className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-foreground">
                    {vehicle.make} {vehicle.model} {vehicle.year}
                  </p>
                  <span className="mt-1 inline-block rounded-md bg-background px-2 py-0.5 font-mono text-xs font-medium tracking-wide text-foreground-muted">
                    {vehicle.plate}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
