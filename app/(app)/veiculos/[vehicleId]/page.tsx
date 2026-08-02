import { notFound } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { getVehicleByIdForUser } from "@/lib/db/queries/vehicles";

export default async function VeiculoPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  const session = await auth();
  const vehicle = await getVehicleByIdForUser(session!.user.id, vehicleId);

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-xl font-semibold">
        {vehicle.make} {vehicle.model} {vehicle.year}
      </h1>
      <p className="text-sm text-zinc-500">Placa {vehicle.plate}</p>

      {vehicle.engineMatchStatus === "unmatched" ? (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Motor ainda não identificado — a curadoria deste modelo ainda não chegou à base. Assim
          que chegar, a ficha completa aparece aqui automaticamente.
        </p>
      ) : null}

      <p className="mt-6 text-sm text-zinc-500">
        Ficha completa de fluidos, filtros e diagrama do cofre do motor (PRD seção 5.3) chega no
        Sprint 2 — ver docs/ROADMAP.md.
      </p>
    </div>
  );
}
