import Link from "next/link";

import { buttonClasses } from "@/components/ui/button-styles";
import { auth } from "@/lib/auth/auth";
import { getVehiclesByUser } from "@/lib/db/queries/vehicles";

export default async function GaragemPage() {
  const session = await auth();
  const vehicles = await getVehiclesByUser(session!.user.id);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Sua garagem</h1>
        <Link href="/veiculos/novo" className={buttonClasses("primary")}>
          Adicionar
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Nenhum veículo cadastrado ainda. Cadastro por placa (PRD seção 5.2) chega no Sprint 1 —
          por ora, use o cadastro manual.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {vehicles.map((vehicle) => (
            <li key={vehicle.id}>
              <Link
                href={`/veiculos/${vehicle.id}`}
                className="block min-h-11 rounded-md border border-zinc-200 px-4 py-3 active:bg-zinc-50 dark:border-zinc-800 dark:active:bg-zinc-900"
              >
                <p className="font-medium">
                  {vehicle.make} {vehicle.model} {vehicle.year}
                </p>
                <p className="text-sm text-zinc-500">{vehicle.plate}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
