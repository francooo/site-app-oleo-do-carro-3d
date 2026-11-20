import { ChevronRight, CircleCheck, Plus, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ScreenHeader } from "@/components/app-shell/screen-header";
import { CtaLink } from "@/components/ui/cta-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { VehicleImage } from "@/components/vehicle/vehicle-image";
import { auth } from "@/lib/auth/auth";
import { getSelectedVehicleForUser, getVehiclesByUser } from "@/lib/db/queries/vehicles";
import { summarizeVehicle } from "@/lib/domain/fluid-status";
import { vehicleDisplayName, vehicleEngineLabel } from "@/lib/domain/vehicle";
import { getFluidStatusesForVehicles } from "@/lib/fluids/vehicle-fluids";
import { selectVehicle } from "@/lib/vehicles/actions";

export const metadata: Metadata = { title: "Minha garagem" };

// Tela 02 — Minha garagem: listar e alternar entre veículos. Tocar no card
// seleciona o carro (contexto das telas técnicas) e abre o Início dele.
export default async function GaragemPage() {
  const session = await auth();
  // O guard do layout (app)/layout.tsx não impede a page de rodar em
  // paralelo em dev; a checagem redundante evita um TypeError no log.
  if (!session?.user) redirect("/login");

  const [vehicles, selected] = await Promise.all([
    getVehiclesByUser(session.user.id),
    getSelectedVehicleForUser(session.user.id),
  ]);
  const statusesByVehicle = await getFluidStatusesForVehicles(session.user.id, vehicles);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 md:py-10">
      <ScreenHeader
        highlight="Minha garagem"
        subtitle={
          vehicles.length > 0
            ? "Escolha o carro que você quer cuidar agora."
            : "Cadastre seu primeiro carro para começar."
        }
      />

      {vehicles.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {vehicles.map((vehicle) => {
            const summary = summarizeVehicle(
              (statusesByVehicle.get(vehicle.id) ?? []).map((x) => x.status),
            );
            const engine = vehicleEngineLabel(vehicle);
            const isSelected = selected?.id === vehicle.id;
            const name = vehicleDisplayName(vehicle);
            return (
              <li key={vehicle.id}>
                <form action={selectVehicle.bind(null, vehicle.id)}>
                  <button
                    type="submit"
                    aria-label={`Abrir ${name}`}
                    className={`group from-surface/95 to-surface-low/95 shadow-card hover:shadow-card-hover relative grid w-full grid-cols-[1fr_44%] items-center gap-2 overflow-hidden rounded-[1.75rem] border bg-gradient-to-b p-5 pr-9 text-left transition-all active:scale-[0.995] sm:pr-10 ${
                      isSelected ? "border-accent/80" : "border-copper/45 hover:border-accent/70"
                    }`}
                  >
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="font-heading text-foreground-strong text-xl leading-tight font-extrabold sm:text-2xl">
                        {name}
                      </span>
                      <span className="text-foreground-muted text-base">
                        {engine || "Motorização não informada"}
                      </span>
                      <span className="mt-3 flex flex-wrap gap-2">
                        {vehicle.confirmedAt ? (
                          <StatusBadge status={summary.status} label={summary.label} />
                        ) : (
                          <span className="border-warning/60 bg-warning-soft text-warning inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap">
                            <TriangleAlert
                              className="h-3.5 w-3.5"
                              strokeWidth={2.4}
                              aria-hidden="true"
                            />
                            Confirmar dados
                          </span>
                        )}
                        {isSelected ? (
                          <span className="text-accent-text inline-flex items-center gap-1.5 px-1 py-1 text-xs font-semibold">
                            <CircleCheck
                              className="h-3.5 w-3.5"
                              strokeWidth={2.4}
                              aria-hidden="true"
                            />
                            Selecionado
                          </span>
                        ) : null}
                      </span>
                    </span>

                    <VehicleImage
                      make={vehicle.make}
                      model={vehicle.model}
                      className="h-28 sm:h-36"
                    />

                    <ChevronRight
                      className="text-accent absolute top-1/2 right-3 h-7 w-7 -translate-y-1/2 transition-transform group-hover:translate-x-0.5"
                      strokeWidth={2.4}
                      aria-hidden="true"
                    />
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="mt-6 lg:max-w-md">
        <CtaLink href="/veiculos/novo" icon={Plus}>
          {vehicles.length > 0 ? "Adicionar carro" : "Cadastrar meu carro"}
        </CtaLink>
      </div>
    </div>
  );
}
