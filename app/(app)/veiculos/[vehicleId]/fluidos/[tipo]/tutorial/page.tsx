import { ArrowRight, Ruler, Thermometer, TriangleAlert, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ScreenHeader } from "@/components/app-shell/screen-header";
import { RegisterCheckForm } from "@/components/fluids/register-check-form";
import { buttonClasses } from "@/components/ui/button-styles";
import { StepCounter, StepDots } from "@/components/ui/stepper";
import { VehicleContextBar } from "@/components/vehicle/vehicle-context-bar";
import type { SafetyIcon } from "@/content/fluidos";
import { isTrackedFluid } from "@/lib/domain/fluids";
import { registerFluidCheck } from "@/lib/fluids/actions";
import { loadVehicleFluids } from "@/lib/fluids/load";

export const metadata: Metadata = { title: "Passo a passo" };

const ALERT_ICON: Record<SafetyIcon, typeof Thermometer> = {
  hot: Thermometer,
  level: Ruler,
  warning: TriangleAlert,
  pro: Wrench,
};

type Props = {
  params: Promise<{ vehicleId: string; tipo: string }>;
  searchParams: Promise<{ passo?: string | string[] }>;
};

// Tela 05 — Tutorial passo a passo. Cada passo é uma URL (?passo=N)
// renderizada no servidor: funciona sem JavaScript e fica no cache offline.
// O passo final é "Registrar verificação", que atualiza o status.
export default async function TutorialPage({ params, searchParams }: Props) {
  const { vehicleId, tipo } = await params;
  if (!isTrackedFluid(tipo)) notFound();
  const { vehicle, fluids } = await loadVehicleFluids(vehicleId);
  const f = fluids.find((x) => x.code === tipo)!;
  const { steps } = f.content;

  const raw = (await searchParams).passo;
  const parsed = Number(Array.isArray(raw) ? raw[0] : raw);
  // 1..N = passos; N+1 = registrar.
  const total = steps.length + 1;
  const current = Number.isInteger(parsed) ? Math.min(Math.max(parsed, 1), total) - 1 : 0;
  const isRegister = current === steps.length;
  const step = steps[current];

  const base = `/veiculos/${vehicle.id}/fluidos/${f.code}`;
  const AlertIcon = step?.alert ? ALERT_ICON[step.alert.icon] : null;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 md:py-10">
      <ScreenHeader
        lead={f.content.tutorialTitle.lead}
        highlight={f.content.tutorialTitle.highlight}
        backHref={current > 0 ? `${base}/tutorial?passo=${current}` : base}
        backLabel={current > 0 ? "Passo anterior" : "Voltar para o fluido"}
      />
      <VehicleContextBar vehicle={vehicle} />

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-8">
        <div className="border-copper/50 relative overflow-hidden rounded-[1.75rem] border">
          <Image
            src={isRegister ? f.content.image : step!.image}
            alt=""
            width={1000}
            height={600}
            priority
            sizes="(min-width: 1024px) 520px, 100vw"
            className="aspect-[5/3] w-full object-cover"
          />
          <StepCounter total={total} current={current} className="absolute top-3 left-3" />
          {step?.alert && AlertIcon ? (
            <div className="border-copper/60 bg-surface-lowest/90 absolute right-3 bottom-3 flex max-w-[65%] items-center gap-2 rounded-xl border px-3 py-2 backdrop-blur">
              <AlertIcon
                className="text-error h-6 w-6 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span className="text-accent-text text-sm leading-tight font-semibold">
                {step.alert.text}
              </span>
            </div>
          ) : null}
        </div>

        <div className="border-copper/45 from-surface/95 to-surface-low/95 shadow-card rounded-[1.75rem] border bg-gradient-to-b p-5">
          {isRegister ? (
            <RegisterCheckForm
              action={registerFluidCheck.bind(null, vehicle.id, f.code)}
              currentKm={vehicle.currentKm}
            />
          ) : (
            <>
              <div
                aria-live="polite"
                className="border-border/70 bg-surface-lowest/60 flex items-start gap-4 rounded-2xl border p-4"
              >
                <span className="border-accent font-heading text-accent-text flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-xl font-extrabold">
                  {current + 1}
                </span>
                <div>
                  <h2 className="font-heading text-foreground-strong text-xl leading-snug font-bold">
                    {step!.title}
                  </h2>
                  {step!.detail ? (
                    <p className="text-foreground-muted mt-2">{step!.detail}</p>
                  ) : null}
                </div>
              </div>

              <StepDots total={total} current={current} className="my-5" />

              <Link
                href={`${base}/tutorial?passo=${current + 2}`}
                className={`${buttonClasses("primary", "lg")} w-full`}
              >
                <span>
                  {current === steps.length - 1 ? "Registrar verificação" : "Próximo passo"}
                </span>
                <ArrowRight
                  className="absolute right-5 h-5 w-5"
                  strokeWidth={2.4}
                  aria-hidden="true"
                />
              </Link>
            </>
          )}
          <div className="mt-4 text-center">
            <Link href={base} className={buttonClasses("ghost")}>
              Sair do tutorial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
