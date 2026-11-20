import { ArrowRight, CircleAlert, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ScreenHeader } from "@/components/app-shell/screen-header";
import { buttonClasses } from "@/components/ui/button-styles";
import { SubmitButton } from "@/components/ui/submit-button";
import { VehicleImage } from "@/components/vehicle/vehicle-image";
import { VehicleSpecList } from "@/components/vehicle/vehicle-spec-list";
import { auth } from "@/lib/auth/auth";
import { getVehicleByIdForUser } from "@/lib/db/queries/vehicles";
import { joinFieldLabels, missingConfirmationFields } from "@/lib/domain/vehicle";
import { confirmVehicle } from "@/lib/vehicles/actions";

export const metadata: Metadata = { title: "Confirme seu veículo" };

// Tela 03 — confirmar a versão antes de carregar dados técnicos (regra de
// conteúdo §4). Dados incompletos geram aviso explícito, mas não bloqueiam:
// o usuário pode não saber a versão agora e completar depois.
export default async function ConfirmarVeiculoPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const vehicle = await getVehicleByIdForUser(session.user.id, vehicleId);
  if (!vehicle) notFound();

  const missing = missingConfirmationFields(vehicle);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 md:py-10">
      <ScreenHeader lead="Confirme" highlight="seu veículo" backHref="/garagem" />

      <div className="grid items-center gap-6 md:grid-cols-[1.1fr_1fr] md:gap-10">
        <VehicleImage
          make={vehicle.make}
          model={vehicle.model}
          variant="hero"
          priority
          className="mx-auto max-h-80 md:max-h-none"
        />

        <section
          aria-label="Dados do veículo"
          className="border-copper/45 from-surface/95 to-surface-low/95 shadow-card rounded-[1.75rem] border bg-gradient-to-b p-4 sm:p-5"
        >
          <VehicleSpecList vehicle={vehicle} />

          {missing.length > 0 ? (
            <div
              role="status"
              className="border-warning/50 bg-warning-soft text-warning mt-4 flex items-start gap-3 rounded-xl border p-4 text-sm"
            >
              <TriangleAlert
                className="mt-0.5 h-5 w-5 shrink-0"
                strokeWidth={2.2}
                aria-hidden="true"
              />
              <p>
                <strong className="font-semibold">Faltam dados: {joinFieldLabels(missing)}.</strong>{" "}
                <span className="text-foreground">
                  Sem eles, capacidades e especificações podem não corresponder ao seu carro. Você
                  pode completar agora ou depois.
                </span>
              </p>
            </div>
          ) : (
            <div className="border-copper/50 bg-warning-soft/60 text-accent-text mt-4 flex items-center justify-center gap-3 rounded-xl border p-4 text-sm font-semibold sm:text-base">
              <CircleAlert className="h-6 w-6 shrink-0" strokeWidth={2} aria-hidden="true" />
              Confira os dados antes de continuar
            </div>
          )}

          <form action={confirmVehicle.bind(null, vehicle.id)} className="mt-4">
            <SubmitButton>
              <span>Confirmar veículo</span>
              <ArrowRight
                className="absolute right-5 h-5 w-5"
                strokeWidth={2.4}
                aria-hidden="true"
              />
            </SubmitButton>
          </form>
          <Link
            href={`/veiculos/${vehicle.id}/editar`}
            className={`${buttonClasses("secondary")} mt-3 w-full`}
          >
            {missing.length > 0 ? "Completar dados" : "Editar dados"}
          </Link>
        </section>
      </div>
    </div>
  );
}
