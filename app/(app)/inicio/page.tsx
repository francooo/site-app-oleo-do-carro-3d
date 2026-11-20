import { ChevronRight, Plus, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { FluidIcon } from "@/components/icons/fluids";
import { cardClasses } from "@/components/ui/card";
import { CtaLink } from "@/components/ui/cta-link";
import { SectionTitle } from "@/components/ui/section-title";
import { StatusBadge } from "@/components/ui/status-badge";
import { VehicleImage } from "@/components/vehicle/vehicle-image";
import { auth } from "@/lib/auth/auth";
import { getSelectedVehicleForUser } from "@/lib/db/queries/vehicles";
import type { FluidStatus } from "@/lib/domain/fluid-status";
import { DASHBOARD_FLUIDS } from "@/lib/domain/fluids";
import { vehicleDisplayName, vehicleEngineLabel } from "@/lib/domain/vehicle";

export const metadata: Metadata = { title: "Início" };

const LEARN_CARDS = [
  {
    title: "Onde fica cada fluido?",
    image: "/brand/aprender/onde-fica-cada-fluido.webp",
    width: 618,
    height: 290,
  },
  {
    title: "Como conferir o nível?",
    image: "/brand/aprender/como-conferir-nivel.webp",
    width: 606,
    height: 290,
  },
];

// Início — "Como está o seu carro?" (referência home-painel-cuidados).
// Celular: coluna única como no mockup. Desktop: carro + CTA à esquerda,
// status e aprendizado à direita.
export default async function InicioPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const vehicle = await getSelectedVehicleForUser(session.user.id);
  const firstName = session.user.name?.split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 md:py-10">
      <header className="mb-6 flex items-center justify-between gap-4 md:mb-8">
        <Link href="/inicio" aria-label="Fluido Fácil — início" className="md:hidden">
          <Logo markClassName="h-12 w-12" tagline="Cuide bem do seu carro" />
        </Link>
        <div className="hidden md:block">
          <h1 className="font-heading text-foreground-strong text-3xl font-extrabold tracking-tight lg:text-4xl">
            {firstName ? `Olá, ${firstName}` : "Olá"}
          </h1>
          <p className="text-foreground-muted mt-1">Cuide bem do seu carro.</p>
        </div>
      </header>

      {vehicle ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
          <div className="flex flex-col gap-5">
            <Link
              href={
                vehicle.confirmedAt
                  ? `/veiculos/${vehicle.id}`
                  : `/veiculos/${vehicle.id}/confirmar`
              }
              className={`${cardClasses(true)} group relative grid grid-cols-[1fr_55%] items-center gap-2 overflow-hidden rounded-[1.75rem] p-5 pr-9 lg:grid-cols-1 lg:pr-5`}
            >
              <span className="min-w-0">
                <span className="font-heading text-foreground-strong block text-2xl leading-tight font-extrabold">
                  {vehicleDisplayName(vehicle)}
                </span>
                <span className="text-foreground-muted mt-1 block">
                  {vehicleEngineLabel(vehicle) || "Motorização não informada"}
                </span>
              </span>
              <VehicleImage
                make={vehicle.make}
                model={vehicle.model}
                priority
                className="h-28 sm:h-36 lg:h-52"
              />
              <ChevronRight
                className="text-accent absolute top-1/2 right-3 h-7 w-7 -translate-y-1/2 transition-transform group-hover:translate-x-0.5 lg:top-8 lg:translate-y-0"
                strokeWidth={2.4}
                aria-hidden="true"
              />
            </Link>

            {!vehicle.confirmedAt ? (
              <Link
                href={`/veiculos/${vehicle.id}/confirmar`}
                className="border-warning/50 bg-warning-soft text-warning hover:border-warning flex items-center gap-3 rounded-xl border p-4 text-sm transition-colors"
              >
                <TriangleAlert className="h-5 w-5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
                <span className="flex-1">
                  <strong className="font-semibold">Confirme os dados do carro</strong>{" "}
                  <span className="text-foreground">antes de ver as instruções técnicas.</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0" strokeWidth={2.4} aria-hidden="true" />
              </Link>
            ) : null}

            <div className="hidden lg:block">
              <CtaLink href="/veiculos/novo" icon={Plus}>
                Cadastrar outro carro
              </CtaLink>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <section aria-labelledby="status-title">
              <SectionTitle>
                <span id="status-title">Como está o seu carro?</span>
              </SectionTitle>
              <ul className="grid grid-cols-3 gap-2.5 sm:gap-4">
                {DASHBOARD_FLUIDS.map((fluid) => {
                  // Fase 1: status ainda não registrado — "Não informado" com
                  // texto, nunca só cor (critério de UX §5).
                  const status: FluidStatus = "nao_informado";
                  return (
                    <li
                      key={fluid.code}
                      className={`${cardClasses()} flex flex-col gap-3 p-2.5 sm:p-4`}
                    >
                      <FluidIcon
                        fluidKey={fluid.code}
                        className="text-accent h-9 w-9 sm:h-11 sm:w-11"
                      />
                      <span className="text-foreground-strong text-sm leading-tight font-medium sm:text-base">
                        {fluid.label}
                      </span>
                      <StatusBadge
                        status={status}
                        size="xs"
                        className="mt-auto w-full sm:w-auto sm:self-start"
                      />
                    </li>
                  );
                })}
              </ul>
            </section>

            <section aria-labelledby="learn-title">
              <SectionTitle>
                <span id="learn-title">Continue aprendendo</span>
              </SectionTitle>
              <ul className="grid grid-cols-2 gap-3 sm:gap-4">
                {LEARN_CARDS.map((card) => (
                  <li key={card.title} className={`${cardClasses()} relative overflow-hidden`}>
                    <Image
                      src={card.image}
                      width={card.width}
                      height={card.height}
                      alt=""
                      sizes="(min-width: 1024px) 340px, 50vw"
                      className="aspect-[2/1] w-full object-cover"
                    />
                    {/* Conteúdo da área Aprender chega na fase 4. */}
                    <span className="border-copper/50 bg-surface-lowest/85 text-foreground absolute top-2 left-2 rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold backdrop-blur">
                      Em breve
                    </span>
                    <p className="text-foreground-strong p-3 text-sm font-medium sm:text-base">
                      {card.title}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <div className="lg:hidden">
              <CtaLink href="/veiculos/novo" icon={Plus}>
                Cadastrar outro carro
              </CtaLink>
            </div>
          </div>
        </div>
      ) : (
        <section className={`${cardClasses()} mx-auto max-w-xl p-6 text-center sm:p-8`}>
          <h2 className="font-heading text-foreground-strong text-2xl font-extrabold">
            Comece pelo seu <span className="text-gradient-amber">carro</span>
          </h2>
          <p className="text-foreground-muted mx-auto mt-2 max-w-sm">
            Com marca, modelo, ano e versão, mostramos onde fica cada fluido e como conferir o nível
            do jeito certo para o seu carro.
          </p>
          <div className="mt-6">
            <CtaLink href="/veiculos/novo" icon={Plus}>
              Cadastrar meu carro
            </CtaLink>
          </div>
        </section>
      )}
    </div>
  );
}
