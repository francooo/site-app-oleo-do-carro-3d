import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  Droplet,
  FileText,
  Search,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ScreenHeader } from "@/components/app-shell/screen-header";
import { FluidIcon, OilIcon } from "@/components/icons/fluids";
import { buttonClasses } from "@/components/ui/button-styles";
import { cardClasses } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { VehicleContextBar } from "@/components/vehicle/vehicle-context-bar";
import { isTrackedFluid } from "@/lib/domain/fluids";
import { loadVehicleFluids } from "@/lib/fluids/load";
import { formatDate } from "@/lib/fluids/view";

type Params = { params: Promise<{ vehicleId: string; tipo: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { tipo } = await params;
  return { title: isTrackedFluid(tipo) ? "Detalhe do fluido" : "Fluido" };
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={`${cardClasses()} flex items-start gap-4 p-4`}>
      <IconTile>{icon}</IconTile>
      <div className="min-w-0">
        <h2 className="font-heading text-foreground-strong text-lg leading-tight font-bold">
          {title}
        </h2>
        <div className="text-foreground-muted mt-1">{children}</div>
      </div>
    </div>
  );
}

const NOT_CURATED = "Ainda não curado para o seu carro — consulte o manual do proprietário.";

// Tela 04 — Detalhe do fluido: função, especificação, capacidade, como
// verificar e, SEPARADO, quando trocar. Fonte + data + ressalva no rodapé.
export default async function FluidoPage({ params }: Params) {
  const { vehicleId, tipo } = await params;
  if (!isTrackedFluid(tipo)) notFound();
  const { vehicle, fluids } = await loadVehicleFluids(vehicleId);
  const f = fluids.find((x) => x.code === tipo)!;
  const base = `/veiculos/${vehicle.id}`;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 md:py-10">
      <ScreenHeader
        lead={f.label.split(" ").slice(0, -1).join(" ") || undefined}
        highlight={f.label.split(" ").at(-1)!}
        backHref={`${base}/mapa`}
        backLabel="Voltar para o mapa"
      />
      <VehicleContextBar vehicle={vehicle} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
        <div className="flex flex-col gap-4">
          <div className="border-copper/45 relative overflow-hidden rounded-[1.75rem] border">
            <Image
              src={f.content.image}
              alt=""
              width={394}
              height={220}
              priority
              sizes="(min-width: 1024px) 420px, 100vw"
              className="aspect-[16/9] w-full object-cover"
            />
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <IconTile size="sm" className="bg-surface-lowest/90">
                <FluidIcon fluidKey={f.code} />
              </IconTile>
              <StatusBadge
                status={f.status.status}
                size="md"
                className="bg-surface-lowest/90 backdrop-blur"
              />
            </div>
          </div>
          <p className="text-foreground-muted flex items-center gap-2 text-sm">
            <CalendarClock className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
            Última verificação:{" "}
            <span className="text-foreground-strong font-semibold">
              {f.status.lastCheckAt ? formatDate(f.status.lastCheckAt) : "--/--/----"}
            </span>
            {f.status.reason ? <span>· {f.status.reason}</span> : null}
          </p>

          <div className="hidden flex-col gap-3 lg:flex">
            <Cta href={`${base}/fluidos/${f.code}/tutorial`} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <InfoCard icon={<Droplet />} title="Para que serve?">
            {f.description}
          </InfoCard>
          <InfoCard icon={<FileText />} title="Especificação">
            <span className={f.specification ? "text-foreground-strong" : ""}>
              {f.specification ?? NOT_CURATED}
            </span>
          </InfoCard>
          <InfoCard icon={<OilIcon />} title="Capacidade">
            {f.capacity ? (
              <>
                <span className="text-foreground-strong">{f.capacity.value}</span>
                {f.capacity.note ? (
                  <span className="text-warning mt-1 block text-sm">{f.capacity.note}</span>
                ) : null}
              </>
            ) : f.code === "brake" && f.sourceNotes ? (
              "Não se completa o circuito em casa — veja as observações abaixo."
            ) : (
              NOT_CURATED
            )}
          </InfoCard>
          <InfoCard icon={<Search />} title="Como verificar">
            {f.content.howToCheck}
          </InfoCard>

          <section className="border-copper/40 bg-surface-lowest/60 mt-2 rounded-2xl border p-4">
            <h2 className="font-heading text-foreground-strong flex items-center gap-2 text-lg font-bold">
              <Wrench className="text-accent h-5 w-5" strokeWidth={2} aria-hidden="true" />
              Quando trocar
            </h2>
            <p className="text-foreground-muted mt-1 text-sm">
              Verificar o nível é com você; a troca do fluido é outra tarefa.
            </p>
            {f.changeInterval ? (
              <p className="text-foreground-strong mt-3 font-semibold">{f.changeInterval}</p>
            ) : null}
            <p className="text-foreground mt-2 text-sm">{f.content.changeInfo}</p>
            {f.sourceNotes ? (
              <p className="text-foreground-muted mt-2 text-sm">{f.sourceNotes}</p>
            ) : null}
          </section>

          <section className="border-warning/40 bg-warning-soft/60 rounded-2xl border p-4">
            <h2 className="text-warning flex items-center gap-2 font-semibold">
              <ShieldAlert className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
              Segurança
            </h2>
            <ul className="text-foreground mt-2 list-disc space-y-1 pl-5 text-sm">
              {f.content.safety.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>

          <footer className="text-foreground-muted flex items-start gap-2 text-xs">
            <BookOpen className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
            {f.source ? (
              <p>
                Fonte:{" "}
                {f.source.reference ? (
                  <a
                    href={f.source.reference}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent-text underline underline-offset-2"
                  >
                    {f.source.name}
                  </a>
                ) : (
                  f.source.name
                )}
                {f.source.verifiedAt ? ` · revisado em ${formatDate(f.source.verifiedAt)}` : ""}.
                Valores para o Fiat Uno 1.0 Flex; confirme no manual se o seu carro for de outra
                versão.
              </p>
            ) : (
              <p>
                Orientação geral, não específica do seu carro. Especificações e capacidades estão no
                manual do proprietário.
              </p>
            )}
          </footer>

          <div className="mt-2 lg:hidden">
            <Cta href={`${base}/fluidos/${f.code}/tutorial`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Cta({ href }: { href: string }) {
  return (
    <Link href={href} className={`${buttonClasses("primary", "lg")} w-full`}>
      <span>Como verificar passo a passo</span>
      <ArrowRight className="absolute right-5 h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
    </Link>
  );
}
