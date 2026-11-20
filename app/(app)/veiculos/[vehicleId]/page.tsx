import { Activity, ChevronRight, Map, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ScreenHeader } from "@/components/app-shell/screen-header";
import { buttonClasses } from "@/components/ui/button-styles";
import { cardClasses } from "@/components/ui/card";
import { VehicleContextBar } from "@/components/vehicle/vehicle-context-bar";
import { VehicleImage } from "@/components/vehicle/vehicle-image";
import { VehicleSpecList } from "@/components/vehicle/vehicle-spec-list";
import { auth } from "@/lib/auth/auth";
import { getVehicleByIdForUser } from "@/lib/db/queries/vehicles";
import { vehicleDisplayName } from "@/lib/domain/vehicle";

export const metadata: Metadata = { title: "Meu carro" };

// Hub do carro: atalhos para o mapa de fluidos e o status, mais os dados
// conferidos e o atalho para editá-los.
export default async function VeiculoPage({ params }: { params: Promise<{ vehicleId: string }> }) {
  const { vehicleId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const vehicle = await getVehicleByIdForUser(session.user.id, vehicleId);
  if (!vehicle) notFound();
  if (!vehicle.confirmedAt) redirect(`/veiculos/${vehicle.id}/confirmar`);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 md:py-10">
      <ScreenHeader highlight={vehicleDisplayName(vehicle)} backHref="/garagem" />
      <VehicleContextBar vehicle={vehicle} />

      <div className="grid items-start gap-6 md:grid-cols-[1.1fr_1fr] md:gap-10">
        <VehicleImage
          make={vehicle.make}
          model={vehicle.model}
          variant="hero"
          priority
          className="mx-auto max-h-72 md:max-h-none"
        />
        <div className="flex flex-col gap-4">
          <nav aria-label="Atalhos do carro" className="grid grid-cols-2 gap-3">
            {[
              { href: `/veiculos/${vehicle.id}/mapa`, label: "Mapa de fluidos", Icon: Map },
              {
                href: `/veiculos/${vehicle.id}/status`,
                label: "Status dos fluidos",
                Icon: Activity,
              },
            ].map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className={`${cardClasses(true)} flex min-h-16 items-center gap-3 p-4`}
              >
                <Icon className="text-accent h-6 w-6 shrink-0" strokeWidth={2} aria-hidden="true" />
                <span className="text-foreground-strong flex-1 text-sm font-semibold sm:text-base">
                  {label}
                </span>
                <ChevronRight
                  className="text-accent h-5 w-5 shrink-0"
                  strokeWidth={2.4}
                  aria-hidden="true"
                />
              </Link>
            ))}
          </nav>
          <section aria-label="Dados do veículo" className={`${cardClasses()} p-4 sm:p-5`}>
            <VehicleSpecList vehicle={vehicle} />
            <Link
              href={`/veiculos/${vehicle.id}/editar`}
              className={`${buttonClasses("secondary")} mt-4 w-full`}
            >
              <Pencil className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
              Editar dados
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
