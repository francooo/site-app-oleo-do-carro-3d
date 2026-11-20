import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ScreenHeader } from "@/components/app-shell/screen-header";
import { VehicleForm } from "@/components/vehicle/vehicle-form";
import { auth } from "@/lib/auth/auth";
import { getVehicleByIdForUser } from "@/lib/db/queries/vehicles";
import { updateVehicle } from "@/lib/vehicles/actions";

export const metadata: Metadata = { title: "Editar veículo" };

// "Editar dados" da tela 03. Salvar zera a confirmação e volta para ela.
export default async function EditarVeiculoPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const vehicle = await getVehicleByIdForUser(session.user.id, vehicleId);
  if (!vehicle) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 md:py-10">
      <ScreenHeader
        lead="Editar"
        highlight="veículo"
        backHref={`/veiculos/${vehicle.id}/confirmar`}
      />
      <VehicleForm
        action={updateVehicle.bind(null, vehicle.id)}
        defaults={vehicle}
        submitLabel="Salvar alterações"
        cancelHref={`/veiculos/${vehicle.id}/confirmar`}
        cancelLabel="Cancelar"
      />
    </div>
  );
}
