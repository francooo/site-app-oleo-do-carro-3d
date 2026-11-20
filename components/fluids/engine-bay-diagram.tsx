"use client";

import { ArrowLeftRight, ArrowRight, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { FluidIcon } from "@/components/icons/fluids";
import { buttonClasses } from "@/components/ui/button-styles";
import { Hotspot } from "@/components/ui/hotspot";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import type { FluidStatus } from "@/lib/domain/fluid-status";

import { FluidFacts, type FluidFactsData } from "./fluid-facts";

export type DiagramFluid = {
  code: string;
  label: string;
  description: string;
  status: FluidStatus;
  facts: FluidFactsData;
  detailHref: string;
};

type Props = {
  image: { src: string; width: number; height: number; alt: string };
  hotspots: { code: string; x: number; y: number }[];
  fluids: DiagramFluid[];
};

// Mapa de fluidos: imagem pré-renderizada do cofre + pontos em %. Tocar num
// ponto abre o painel do fluido (bottom sheet no celular, painel fixo no
// desktop). A lista textual equivalente fica FORA deste componente, no
// servidor, para funcionar sem JavaScript (critério de UX §5).
export function EngineBayDiagram({ image, hotspots, fluids }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const fluid = fluids.find((f) => f.code === selected) ?? null;

  useEffect(() => {
    if (!selected) return;
    // Leva o foco ao painel (leitor de tela anuncia o fluido escolhido).
    sheetRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <div
        className="border-copper/40 relative mx-auto w-full max-w-2xl overflow-hidden rounded-[1.75rem] border"
        style={{ aspectRatio: `${image.width} / ${image.height}` }}
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority
          sizes="(min-width: 1024px) 640px, 100vw"
          className="object-cover"
        />
        {hotspots.map((h) => {
          const f = fluids.find((x) => x.code === h.code);
          if (!f) return null;
          return (
            <Hotspot
              key={h.code}
              x={h.x}
              y={h.y}
              label={f.label}
              active={selected === h.code}
              onSelect={() => setSelected(selected === h.code ? null : h.code)}
              icon={<FluidIcon fluidKey={h.code} className="text-accent h-4 w-4" />}
            />
          );
        })}
      </div>

      {/* Desktop: painel fixo à direita. */}
      <aside className="hidden lg:sticky lg:top-6 lg:block" aria-live="polite">
        {fluid ? (
          <FluidPanel fluid={fluid} />
        ) : (
          <div className="border-copper/40 bg-surface-low/80 text-foreground-muted rounded-[1.75rem] border p-6 text-sm">
            <p className="font-heading text-foreground-strong mb-1 text-lg font-bold">
              Toque em um ponto âmbar
            </p>
            Cada ponto mostra onde fica um reservatório. Ou use a lista logo abaixo.
          </div>
        )}
      </aside>

      {/* Celular: bottom sheet sobre a barra inferior. */}
      {fluid ? (
        <div className="lg:hidden">
          <button
            type="button"
            aria-label="Fechar painel"
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-[45] bg-black/55"
          />
          <div
            ref={sheetRef}
            tabIndex={-1}
            role="dialog"
            aria-label={fluid.label}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto outline-none"
          >
            <FluidPanel fluid={fluid} onClose={() => setSelected(null)} sheet />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FluidPanel({
  fluid,
  onClose,
  sheet = false,
}: {
  fluid: DiagramFluid;
  onClose?: () => void;
  sheet?: boolean;
}) {
  return (
    <div
      className={`border-copper/50 from-surface to-surface-lowest shadow-card border bg-gradient-to-b p-5 ${
        sheet ? "rounded-t-[1.75rem] border-b-0 pb-8" : "rounded-[1.75rem]"
      }`}
    >
      <div className="mb-4 flex items-start gap-4">
        <IconTile size="lg">
          <FluidIcon fluidKey={fluid.code} />
        </IconTile>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-foreground-strong text-xl leading-tight font-extrabold">
            {fluid.label}
          </h2>
          <p className="text-foreground-muted mt-1 text-sm">{fluid.description}</p>
          <StatusBadge status={fluid.status} className="mt-2" />
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-foreground-muted hover:text-foreground -mt-1 -mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <FluidFacts data={fluid.facts} />

      <Link href={fluid.detailHref} className={`${buttonClasses("primary", "lg")} mt-4 w-full`}>
        <span>Ver instruções</span>
        <ArrowRight className="absolute right-5 h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
      </Link>
      <Link href="/garagem" className={`${buttonClasses("secondary")} mt-3 w-full`}>
        <ArrowLeftRight className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
        Trocar carro
      </Link>
    </div>
  );
}
