import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ScreenHeader } from "@/components/app-shell/screen-header";
import { PlateConfirmForm } from "@/components/vehicle/plate-confirm-form";
import { VehicleImage } from "@/components/vehicle/vehicle-image";
import { VehicleSpecList } from "@/components/vehicle/vehicle-spec-list";
import { auth } from "@/lib/auth/auth";
import { getLookupForUser, rowToPlateVehicle } from "@/lib/db/queries/plate-lookups";
import { pickFipeVersion, plateVehicleTitle } from "@/lib/domain/plate-vehicle";
import { createVehicleFromLookup } from "@/lib/vehicles/plate-actions";

export const metadata: Metadata = { title: "É este carro?" };

// "É este carro?" — resultado da consulta pela placa. Confirmar cria o
// veículo já conferido e abre o mapa de fluidos; "Não é o meu carro" leva ao
// cadastro manual com a placa preenchida.
export default async function ConfirmarPlacaPage({
  params,
}: {
  params: Promise<{ lookupId: string }>;
}) {
  const { lookupId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const row = await getLookupForUser(lookupId, session.user.id);
  const vehicle = row ? rowToPlateVehicle(row) : null;
  if (!row || !vehicle) notFound();

  const choice = pickFipeVersion({
    versions: vehicle.fipeVersions,
    engineDisplacement: vehicle.engineDisplacement,
  });
  const shown = choice.ambiguous ? null : choice.chosen;
  const title = plateVehicleTitle(vehicle);
  const manualHref = `/veiculos/novo/manual?${new URLSearchParams({
    placa: vehicle.plate,
    motivo: "outro_carro",
  })}`;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 md:py-10">
      <ScreenHeader
        lead="É este"
        highlight="carro?"
        subtitle={`Placa ${vehicle.plate}`}
        backHref="/veiculos/novo"
        backLabel="Buscar outra placa"
      />

      <div className="grid items-start gap-6 md:grid-cols-[1.1fr_1fr] md:gap-10">
        <div className="flex flex-col items-center gap-4">
          <VehicleImage
            make={vehicle.make}
            model={vehicle.model}
            variant="hero"
            priority
            className="mx-auto max-h-72 md:max-h-none"
          />
          <p className="font-heading text-foreground-strong text-center text-2xl font-bold md:text-3xl">
            {title}
          </p>
        </div>

        <section
          aria-label="Dados encontrados pela placa"
          className="border-copper/45 from-surface/95 to-surface-low/95 shadow-card rounded-[1.75rem] border bg-gradient-to-b p-4 sm:p-5"
        >
          <VehicleSpecList
            vehicle={{
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.modelYear ?? vehicle.manufactureYear ?? 0,
              version: shown?.name ?? (choice.ambiguous ? null : vehicle.version),
              engineDisplacement: vehicle.engineDisplacement,
              fuel: shown?.fuel ?? vehicle.fuel,
              hasAirConditioning: null,
              currentKm: null,
            }}
            hide={choice.ambiguous ? ["ac", "version"] : ["ac"]}
          />
          <PlateConfirmForm
            action={createVehicleFromLookup.bind(null, row.id)}
            versionOptions={choice.ambiguous ? choice.options : []}
            defaultVersionCode={choice.chosen?.code ?? null}
            manualHref={manualHref}
          />
        </section>
      </div>
    </div>
  );
}
