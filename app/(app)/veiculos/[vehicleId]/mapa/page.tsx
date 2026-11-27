import { ChevronRight, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ScreenHeader } from "@/components/app-shell/screen-header";
import { EngineBayDiagram } from "@/components/fluids/engine-bay-diagram";
import { FluidIcon } from "@/components/icons/fluids";
import { cardClasses } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { VehicleContextBar } from "@/components/vehicle/vehicle-context-bar";
import { getPublishedCuration } from "@/lib/db/queries/curations";
import { getLayoutVisuals, planEngine, planParts } from "@/lib/domain/bay-model";
import { sheetFromCuration } from "@/lib/domain/curation";
import { loadVehicleFluids } from "@/lib/fluids/load";

export const metadata: Metadata = { title: "Mapa de fluidos" };

// Proporção real das fotos curadas (hoje só public/brand/mapa-motor-piloto.webp).
const LAYOUT_IMAGE_SIZE = { width: 960, height: 940 };

// Mapa de fluidos (referência mapa-fluidos-fiat-uno.png). O mapa é um atalho
// visual; a lista abaixo é a alternativa textual obrigatória (UX §5) e
// funciona sem JavaScript.
export default async function MapaPage({ params }: { params: Promise<{ vehicleId: string }> }) {
  const { vehicleId } = await params;
  const { vehicle, sheet, fluids } = await loadVehicleFluids(vehicleId);
  const layout = sheet?.layout;
  const sourceName = sheet?.fluids[0]?.source?.name ?? null;
  // Ficha de posições → cena 3D gerada e planta 2D (cofre sem foto curada).
  const published = layout ? await getPublishedCuration(layout.code) : null;
  const visuals = getLayoutVisuals(layout?.code, published ? sheetFromCuration(published) : null);
  const plan = visuals.sheet
    ? {
        title: visuals.sheet.title,
        engine: planEngine(visuals.sheet),
        parts: planParts(visuals.sheet),
      }
    : null;
  const image = layout?.imageStoragePath
    ? {
        src: layout.imageStoragePath,
        ...LAYOUT_IMAGE_SIZE,
        alt: `Cofre do motor do ${vehicle.make} ${vehicle.model} com o capô aberto`,
      }
    : null;
  const hotspots =
    layout?.hotspots
      .filter((h) => h.fluidType)
      .map((h) => ({ code: h.fluidType!, x: Number(h.x), y: Number(h.y) })) ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 md:py-10">
      <ScreenHeader
        lead="Mapa de"
        highlight="fluidos"
        subtitle="Identifique os pontos e cuide do seu carro"
        backHref="/inicio"
      />
      <VehicleContextBar vehicle={vehicle} />

      {sourceName ? (
        <p className="text-foreground-muted mb-5 flex items-start gap-2 text-sm">
          <Info
            className="text-accent mt-0.5 h-4 w-4 shrink-0"
            strokeWidth={2.2}
            aria-hidden="true"
          />
          <span>Dados do {sourceName}. Na dúvida, confira no manual do seu carro.</span>
        </p>
      ) : null}

      {(image || plan) && hotspots.length > 0 ? (
        <EngineBayDiagram
          image={image}
          plan={image ? null : plan}
          hotspots={hotspots}
          scene={visuals.scene}
          fluids={fluids.map((f) => ({
            code: f.code,
            label: f.label,
            description: f.description,
            status: f.status.status,
            facts: {
              specification: f.specification,
              capacity: f.capacity,
              howToCheck: f.content.howToCheck,
            },
            detailHref: `/veiculos/${vehicle.id}/fluidos/${f.code}`,
          }))}
        />
      ) : (
        <div className="border-copper/40 bg-surface-low/80 mb-2 flex items-start gap-3 rounded-2xl border p-5">
          <Info
            className="text-accent mt-0.5 h-5 w-5 shrink-0"
            strokeWidth={2.2}
            aria-hidden="true"
          />
          <div className="text-sm">
            {sheet ? (
              <>
                <p className="font-heading text-foreground-strong text-base font-bold">
                  O mapa do cofre deste carro está sendo montado
                </p>
                <p className="text-foreground-muted mt-1">
                  A ficha já está pronta: abra cada fluido abaixo para ver qual usar, quanto cabe,
                  quando trocar e como verificar no seu {vehicle.model}.
                </p>
              </>
            ) : (
              <>
                <p className="font-heading text-foreground-strong text-base font-bold">
                  Ainda não temos os dados deste carro
                </p>
                <p className="text-foreground-muted mt-1">
                  Seu {vehicle.make} {vehicle.model} entrou na nossa fila de curadoria. Enquanto
                  isso, os guias abaixo valem para qualquer carro — confira sempre o manual do seu.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <section aria-labelledby="lista-fluidos" className="mt-8">
        <h2
          id="lista-fluidos"
          className="font-heading text-foreground-strong mb-3 text-lg font-bold md:text-xl"
        >
          Fluidos do seu carro
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fluids.map((f) => (
            <li key={f.code}>
              <Link
                href={`/veiculos/${vehicle.id}/fluidos/${f.code}`}
                className={`${cardClasses(true)} flex min-h-16 items-center gap-3 p-4`}
              >
                <FluidIcon fluidKey={f.code} className="text-accent h-8 w-8 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="text-foreground-strong block font-semibold">{f.label}</span>
                  <span className="text-foreground-muted block truncate text-sm">
                    {f.content.howToCheck}
                  </span>
                  <StatusBadge status={f.status.status} className="mt-1.5" />
                </span>
                <ChevronRight
                  className="text-accent h-5 w-5 shrink-0"
                  strokeWidth={2.4}
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
