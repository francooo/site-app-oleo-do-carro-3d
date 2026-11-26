"use client";

import { ArrowLeftRight, ArrowRight, Box, Camera, LayoutGrid, Move3d, X } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { FluidIcon } from "@/components/icons/fluids";
import { buttonClasses } from "@/components/ui/button-styles";
import { Hotspot } from "@/components/ui/hotspot";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import type { EngineScene } from "@/lib/domain/engine-scene";
import type { FluidStatus } from "@/lib/domain/fluid-status";

import { EngineBayPlan, type PlanData } from "./engine-bay-plan";
import { FluidFacts, type FluidFactsData } from "./fluid-facts";

// three.js só no navegador e só nesta tela (fica fora do bundle do resto).
const EngineBay3D = dynamic(() => import("./engine-bay-3d"), {
  ssr: false,
  loading: () => (
    <div className="text-foreground-muted flex h-full items-center justify-center text-sm">
      Carregando o motor em 3D…
    </div>
  ),
});

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}
const noopSubscribe = () => () => {};

export type DiagramFluid = {
  code: string;
  label: string;
  description: string;
  status: FluidStatus;
  facts: FluidFactsData;
  detailHref: string;
};

type Props = {
  /** Foto curada do cofre. Sem foto, o mapa 2D é a planta gerada (`plan`). */
  image?: { src: string; width: number; height: number; alt: string } | null;
  /** Planta 2D gerada da ficha de posições (lib/domain/bay-model.ts). */
  plan?: PlanData | null;
  /** Pontos em % sobre a foto ou sobre a planta. */
  hotspots: { code: string; x: number; y: number }[];
  fluids: DiagramFluid[];
  /** Cena 3D do layout, quando existir (lib/domain/engine-scene.ts). */
  scene?: EngineScene | null;
};

// Mapa de fluidos: imagem pré-renderizada do cofre + pontos em %. Tocar num
// ponto abre o painel do fluido (bottom sheet no celular, painel fixo no
// desktop). A lista textual equivalente fica FORA deste componente, no
// servidor, para funcionar sem JavaScript (critério de UX §5).
export function EngineBayDiagram({ image, plan, hotspots, fluids, scene }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<"3d" | "flat">("3d");
  const sheetRef = useRef<HTMLDivElement>(null);
  const fluid = fluids.find((f) => f.code === selected) ?? null;
  // No servidor responde false → a foto é o HTML inicial; o 3D entra no navegador.
  const webgl = useSyncExternalStore(noopSubscribe, hasWebGL, () => false);
  const show3D = Boolean(scene) && webgl && view === "3d";
  const pointFluids = hotspots
    .map((h) => fluids.find((f) => f.code === h.code))
    .filter((f): f is DiagramFluid => f != null);

  // Na foto, rótulo ao lado do ponto; na planta (pontos mais juntos), ícone
  // dentro do ponto e os nomes nos atalhos logo abaixo.
  const hotspotButtons = hotspots.map((h) => {
    const f = fluids.find((x) => x.code === h.code);
    if (!f) return null;
    const icon = <FluidIcon fluidKey={h.code} className="text-accent h-4 w-4" />;
    return (
      <Hotspot
        key={h.code}
        x={h.x}
        y={h.y}
        label={f.label}
        active={selected === h.code}
        onSelect={() => setSelected(selected === h.code ? null : h.code)}
        icon={image ? icon : undefined}
        glyph={image ? undefined : icon}
      />
    );
  });

  const shortcuts = (
    <div className="mt-3 flex flex-wrap gap-2">
      {pointFluids.map((f) => (
        <button
          key={f.code}
          type="button"
          aria-pressed={selected === f.code}
          onClick={() => setSelected(selected === f.code ? null : f.code)}
          className={`flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition ${
            selected === f.code
              ? "border-accent bg-accent/15 text-foreground-strong"
              : "border-copper/50 text-foreground hover:border-accent"
          }`}
        >
          <FluidIcon fluidKey={f.code} className="text-accent h-4 w-4" />
          {f.label}
        </button>
      ))}
    </div>
  );

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
      <div className="mx-auto w-full max-w-2xl">
        {scene && webgl ? (
          <div
            role="group"
            aria-label="Modo de visualização"
            className="border-copper/40 bg-surface-low/80 mb-3 flex w-full rounded-full border p-1 text-sm font-semibold"
          >
            {(
              [
                ["3d", "Motor em 3D", Box],
                image
                  ? (["flat", "Foto real", Camera] as const)
                  : (["flat", "Planta do cofre", LayoutGrid] as const),
              ] as const
            ).map(([key, text, Icon]) => (
              <button
                key={key}
                type="button"
                aria-pressed={view === key}
                onClick={() => setView(key)}
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full transition ${
                  view === key
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                {text}
              </button>
            ))}
          </div>
        ) : null}

        {show3D && scene ? (
          <>
            <div
              className="border-copper/40 relative w-full touch-none overflow-hidden rounded-[1.75rem] border bg-[radial-gradient(ellipse_at_50%_30%,#2a2420_0%,#11100f_70%)]"
              style={{ aspectRatio: "1 / 1" }}
            >
              <EngineBay3D
                scene={scene}
                fluids={pointFluids.map((f) => ({ code: f.code, label: f.label }))}
                selected={selected}
                onSelect={setSelected}
              />
              <p className="text-foreground-muted pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5 text-xs">
                <Move3d className="h-4 w-4" aria-hidden="true" />
                Arraste para girar · pinça para aproximar
              </p>
            </div>
            <p className="text-foreground-muted mt-2 text-xs">{scene.caption}</p>
            {/* Atalhos: no celular os rótulos 3D ficam pequenos. */}
            {shortcuts}
          </>
        ) : image ? (
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
            {hotspotButtons}
          </div>
        ) : plan ? (
          <>
            <EngineBayPlan plan={plan}>{hotspotButtons}</EngineBayPlan>
            <p className="text-foreground-muted mt-2 text-xs">
              Planta ilustrativa do cofre visto de frente, com o capô aberto — posições conforme a
              figura do manual.
            </p>
            {shortcuts}
          </>
        ) : null}
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
            Cada ponto mostra onde fica um reservatório e qual fluido vai nele. Ou use a lista logo
            abaixo.
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
