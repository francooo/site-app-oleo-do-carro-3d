import { ArrowRight, CalendarDays, ChevronRight, CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ScreenHeader } from "@/components/app-shell/screen-header";
import { FluidIcon } from "@/components/icons/fluids";
import { buttonClasses } from "@/components/ui/button-styles";
import { cardClasses } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { VehicleContextBar } from "@/components/vehicle/vehicle-context-bar";
import { DEFAULT_CHECK_INTERVAL_DAYS } from "@/lib/domain/fluid-status";
import { fluidLabel, isTrackedFluid } from "@/lib/domain/fluids";
import { loadVehicleFluids } from "@/lib/fluids/load";
import { formatDate } from "@/lib/fluids/view";

export const metadata: Metadata = { title: "Status dos fluidos" };

type Props = {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<{ registrado?: string; atualizar?: string }>;
};

// Tela 06 — Status dos fluidos. O status é derivado dos registros (não há
// edição manual "na mão"): "Atualizar status" leva a registrar uma
// verificação do fluido escolhido.
export default async function StatusPage({ params, searchParams }: Props) {
  const { vehicleId } = await params;
  const { registrado, atualizar } = await searchParams;
  const { vehicle, fluids } = await loadVehicleFluids(vehicleId);
  const base = `/veiculos/${vehicle.id}`;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 md:py-10">
      <ScreenHeader lead="Status dos" highlight="fluidos" backHref={`${base}/mapa`} />
      <VehicleContextBar vehicle={vehicle} />

      {registrado && isTrackedFluid(registrado) ? (
        <p
          role="status"
          className="border-success/50 bg-success-soft text-success mb-5 flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold"
        >
          <CircleCheck className="h-5 w-5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
          Verificação de {fluidLabel(registrado).toLowerCase()} registrada.
        </p>
      ) : null}

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {fluids.map((f) => (
          <li key={f.code}>
            <Link
              href={`${base}/fluidos/${f.code}`}
              className={`${cardClasses(true)} flex h-full flex-col overflow-hidden`}
            >
              <Image
                src={f.content.image}
                alt=""
                width={394}
                height={220}
                sizes="(min-width: 1024px) 260px, 50vw"
                className="aspect-[16/9] w-full object-cover"
              />
              <span className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
                <span className="flex items-center gap-2">
                  <FluidIcon fluidKey={f.code} className="text-accent h-7 w-7 shrink-0" />
                  <span className="text-foreground-strong text-sm leading-tight font-semibold sm:text-base">
                    {f.label}
                  </span>
                </span>
                <StatusBadge
                  status={f.status.status}
                  size="xs"
                  className="w-full sm:w-auto sm:self-start"
                />
                {f.status.reason ? (
                  <span className="text-foreground-muted text-xs">{f.status.reason}</span>
                ) : null}
                <span className="border-border/50 mt-auto flex items-center gap-2 border-t pt-2">
                  <CalendarDays
                    className="text-foreground-muted h-4 w-4 shrink-0"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 text-xs leading-tight">
                    <span className="text-foreground-muted block">Última verificação:</span>
                    <span className="text-foreground-strong font-semibold">
                      {f.status.lastCheckAt ? formatDate(f.status.lastCheckAt) : "--/--/----"}
                    </span>
                  </span>
                  <ChevronRight
                    className="text-accent h-4 w-4 shrink-0"
                    strokeWidth={2.4}
                    aria-hidden="true"
                  />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-foreground-muted mt-4 text-xs">
        Sugestão do app: conferir os níveis a cada {DEFAULT_CHECK_INTERVAL_DAYS} dias, além do que o
        manual pede (no Uno: a cada 500 km ou antes de viagens longas).
      </p>

      {atualizar ? (
        <section
          id="atualizar"
          aria-labelledby="atualizar-titulo"
          className="border-copper/50 bg-surface-low/90 mt-6 rounded-[1.75rem] border p-5"
        >
          <h2
            id="atualizar-titulo"
            className="font-heading text-foreground-strong text-lg font-bold"
          >
            Qual fluido você verificou?
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {fluids.map((f) => (
              <li key={f.code}>
                <Link
                  href={`${base}/fluidos/${f.code}/tutorial?passo=${f.content.steps.length + 1}`}
                  className="border-border/80 bg-surface-lowest/70 hover:border-accent flex min-h-14 items-center gap-3 rounded-xl border px-4 transition-colors"
                >
                  <FluidIcon fluidKey={f.code} className="text-accent h-6 w-6 shrink-0" />
                  <span className="text-foreground-strong flex-1 font-medium">{f.label}</span>
                  <ChevronRight
                    className="text-accent h-5 w-5"
                    strokeWidth={2.4}
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div className="mt-6 lg:max-w-md">
          <Link
            href={`${base}/status?atualizar=1#atualizar`}
            className={`${buttonClasses("primary", "lg")} w-full`}
          >
            <span>Atualizar status</span>
            <ArrowRight className="absolute right-5 h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  );
}
