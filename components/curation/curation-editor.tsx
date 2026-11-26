"use client";

import { Check, CircleAlert, ImageUp, Sparkles, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState, useTransition, type ReactNode } from "react";

import { EngineBayPlan } from "@/components/fluids/engine-bay-plan";
import { FluidIcon } from "@/components/icons/fluids";
import { buttonClasses } from "@/components/ui/button-styles";
import { Hotspot } from "@/components/ui/hotspot";
import type { CurationDraft } from "@/lib/ai/curation-assistant";
import { draftFluids, saveCuration } from "@/lib/curation/actions";
import { planEngine, planHotspots, planParts, sceneFromSheet } from "@/lib/domain/bay-model";
import { BAY_ITEM_FLUID, type BayItem, type BayPoint } from "@/lib/domain/bay-positions";
import {
  BAY_ITEMS,
  type CurationFile,
  type CurationFluid,
  emptyCuration,
  pointFromFigureClick,
  sheetFromCuration,
  validateCuration,
} from "@/lib/domain/curation";
import { TRACKED_FLUIDS } from "@/lib/domain/fluids";

const EngineBay3D = dynamic(() => import("@/components/fluids/engine-bay-3d"), { ssr: false });

const input =
  "border-border bg-surface-lowest/80 text-foreground focus:border-accent min-h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none";
const FLUID_LABEL = Object.fromEntries(TRACKED_FLUIDS.map((f) => [f.code, f.label]));

// Editor da curadoria: dados do carro → cliques na figura do manual →
// fluidos (com rascunho por IA) → prévia ao vivo → salvar o arquivo.
export function CurationEditor({ existing }: { existing: CurationFile[] }) {
  const [c, setC] = useState<CurationFile>(() => structuredClone(existing[0] ?? emptyCuration()));
  const [figure, setFigure] = useState<string | null>(null);
  const [item, setItem] = useState<BayItem>("washer");
  const [height, setHeight] = useState<BayPoint["height"]>("mid");
  const [preview, setPreview] = useState<"plan" | "3d">("plan");
  const [sourceText, setSourceText] = useState("");
  const [draft, setDraft] = useState<CurationDraft | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: ReactNode } | null>(null);
  const [pending, start] = useTransition();

  const errors = useMemo(() => validateCuration(c), [c]);
  const sheet = useMemo(() => sheetFromCuration(c), [c]);
  const scene = useMemo(() => sceneFromSheet(sheet), [sheet]);

  const set = (fn: (d: CurationFile) => void) =>
    setC((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });

  function onFigureClick(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - r.left) / r.width) * 100;
    const yPct = ((e.clientY - r.top) / r.height) * 100;
    set((d) => {
      const prev = d.points.find((p) => p.item === item);
      const ref = prev?.figureRef ?? Math.max(0, ...d.points.map((p) => p.figureRef)) + 1;
      const point = pointFromFigureClick(item, xPct, yPct, ref, height);
      d.points = [...d.points.filter((p) => p.item !== item), point];
    });
    // Próximo item ainda não marcado, para marcar em sequência.
    const next = BAY_ITEMS.find((b) => b.item !== item && !c.points.some((p) => p.item === b.item));
    if (next) setItem(next.item);
  }

  function applyDraft(d: CurationDraft) {
    setDraft(d);
    set((cur) => {
      for (const f of d.fluids) {
        const target = cur.fluids.find((x) => x.fluidType === f.fluidType);
        if (!target) continue; // transmissão: fora dos 4 acompanhados
        // Só preenche o que está vazio: nunca sobrescreve o que a pessoa digitou.
        if (!target.specification && f.specification) target.specification = f.specification;
        target.viscosity ??= f.viscosity;
        target.volumeMl ??= f.volumeMl;
        target.volumeWithFilterMl ??= f.volumeWithFilterMl;
        target.intervalKm ??= f.intervalKm;
        target.intervalMonths ??= f.intervalMonths;
        target.warnings ??= f.warnings;
      }
    });
  }

  return (
    <div className="mt-6 flex flex-col gap-8">
      <Section title="Arquivo">
        <div className="flex flex-wrap items-center gap-2">
          {existing.map((f) => (
            <button
              key={f.layout.code}
              type="button"
              onClick={() => setC(structuredClone(f))}
              className={`${buttonClasses("secondary")} min-h-10 px-4 text-sm`}
            >
              Editar {f.layout.code}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setC(emptyCuration());
              setDraft(null);
            }}
            className={`${buttonClasses("primary")} min-h-10 px-4 text-sm`}
          >
            Novo carro
          </button>
        </div>
      </Section>

      <Section title="1. Carro e fonte">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Código do layout (ex.: vw-gol-g6)">
            <input
              className={input}
              value={c.layout.code}
              onChange={(e) =>
                set((d) => void (d.layout.code = e.target.value.trim().toLowerCase()))
              }
            />
          </Field>
          <Field label="Título do cofre" wide>
            <input
              className={input}
              value={c.layout.title}
              placeholder="Cofre do Volkswagen Gol 1.0"
              onChange={(e) => set((d) => void (d.layout.title = e.target.value))}
            />
          </Field>
          <Field label="Página da figura / da legenda">
            <div className="flex gap-2">
              <input
                className={input}
                type="number"
                value={c.layout.figurePage || ""}
                onChange={(e) => set((d) => void (d.layout.figurePage = Number(e.target.value)))}
              />
              <input
                className={input}
                type="number"
                value={c.layout.legendPage || ""}
                onChange={(e) => set((d) => void (d.layout.legendPage = Number(e.target.value)))}
              />
            </div>
          </Field>
          <Field label="Fonte (nome do manual)" wide>
            <input
              className={input}
              value={c.source.name}
              onChange={(e) => set((d) => void (d.source.name = e.target.value))}
            />
          </Field>
          <Field label="Link do manual (PDF oficial)">
            <input
              className={input}
              value={c.source.reference ?? ""}
              onChange={(e) => set((d) => void (d.source.reference = e.target.value || null))}
            />
          </Field>
          <Field label="Conferido em">
            <input
              className={input}
              type="date"
              value={c.source.verifiedAt}
              onChange={(e) => set((d) => void (d.source.verifiedAt = e.target.value))}
            />
          </Field>
          <Field label="Segunda fonte (o que confirma e onde)" wide>
            <input
              className={input}
              value={c.secondSource}
              onChange={(e) => set((d) => void (d.secondSource = e.target.value))}
            />
          </Field>
          <Field label="Código do motor (ex.: vw-1.0-mpi-flex)">
            <input
              className={input}
              value={c.engine.code}
              onChange={(e) =>
                set((d) => void (d.engine.code = e.target.value.trim().toLowerCase()))
              }
            />
          </Field>
          <Field label="Cilindrada · cilindros">
            <div className="flex gap-2">
              <input
                className={input}
                value={c.engine.displacement}
                onChange={(e) => set((d) => void (d.engine.displacement = e.target.value))}
              />
              <input
                className={input}
                type="number"
                value={c.engine.cylinders ?? ""}
                onChange={(e) =>
                  set(
                    (d) =>
                      void (d.engine.cylinders = e.target.value ? Number(e.target.value) : null),
                  )
                }
              />
            </div>
          </Field>
          <Field label="Combustível · aspiração">
            <div className="flex gap-2">
              <select
                className={input}
                value={c.engine.fuelType}
                onChange={(e) =>
                  set(
                    (d) =>
                      void (d.engine.fuelType = e.target
                        .value as CurationFile["engine"]["fuelType"]),
                  )
                }
              >
                <option value="flex">Flex</option>
                <option value="gasoline">Gasolina</option>
                <option value="ethanol">Etanol</option>
                <option value="diesel">Diesel</option>
              </select>
              <select
                className={input}
                value={c.engine.aspiration ?? ""}
                onChange={(e) =>
                  set(
                    (d) =>
                      void (d.engine.aspiration = (e.target.value ||
                        null) as CurationFile["engine"]["aspiration"]),
                  )
                }
              >
                <option value="">Não distingue</option>
                <option value="naturally_aspirated">Aspirado</option>
                <option value="turbo">Turbo</option>
              </select>
            </div>
          </Field>
          <Field label="Observação do motor" wide>
            <input
              className={input}
              value={c.engine.notes}
              onChange={(e) => set((d) => void (d.engine.notes = e.target.value))}
            />
          </Field>
        </div>

        <h3 className="text-foreground-strong mt-5 mb-2 text-sm font-semibold">
          Modelos e anos cobertos
        </h3>
        <div className="flex flex-col gap-2">
          {c.trims.map((t, i) => (
            <div
              key={i}
              className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_6rem_6rem_2fr_auto]"
            >
              <input
                className={input}
                aria-label="Marca"
                placeholder="Marca"
                value={t.make}
                onChange={(e) => set((d) => void (d.trims[i]!.make = e.target.value))}
              />
              <input
                className={input}
                aria-label="Modelo"
                placeholder="Modelo"
                value={t.model}
                onChange={(e) => set((d) => void (d.trims[i]!.model = e.target.value))}
              />
              <input
                className={input}
                aria-label="Ano inicial"
                type="number"
                value={t.yearFrom}
                onChange={(e) => set((d) => void (d.trims[i]!.yearFrom = Number(e.target.value)))}
              />
              <input
                className={input}
                aria-label="Ano final"
                type="number"
                value={t.yearTo}
                onChange={(e) => set((d) => void (d.trims[i]!.yearTo = Number(e.target.value)))}
              />
              <input
                className={input}
                aria-label="Observação"
                placeholder="Observação (ex.: só a versão turbo)"
                value={t.hint}
                onChange={(e) => set((d) => void (d.trims[i]!.hint = e.target.value))}
              />
              <button
                type="button"
                aria-label="Remover modelo"
                onClick={() => set((d) => void d.trims.splice(i, 1))}
                className="text-foreground-muted hover:text-foreground flex min-h-10 items-center justify-center px-2"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              set(
                (d) =>
                  void d.trims.push({
                    make: "",
                    model: "",
                    yearFrom: 2020,
                    yearTo: 2020,
                    hint: "",
                  }),
              )
            }
            className="text-accent self-start text-sm font-semibold"
          >
            + Adicionar modelo
          </button>
        </div>
      </Section>

      <Section title="2. Figura do cofre">
        <p className="text-foreground-muted text-sm">
          Carregue um print da figura &quot;compartimento do motor&quot; do manual (vista de frente,
          painel em cima). Escolha o item e clique sobre ele na figura.
        </p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-3">
            <label
              className={`${buttonClasses("secondary")} min-h-10 cursor-pointer self-start px-4 text-sm`}
            >
              <ImageUp className="h-4 w-4" aria-hidden="true" />
              Carregar figura
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setFigure(URL.createObjectURL(f));
                }}
              />
            </label>
            <div className="flex flex-wrap gap-1.5">
              {BAY_ITEMS.map((b) => {
                const done = c.points.some((p) => p.item === b.item);
                const fluid = BAY_ITEM_FLUID[b.item];
                return (
                  <button
                    key={b.item}
                    type="button"
                    aria-pressed={item === b.item}
                    onClick={() => setItem(b.item)}
                    className={`flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold ${
                      item === b.item
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-copper/50 text-foreground"
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                    {b.label}
                    {fluid ? " ●" : ""}
                  </button>
                );
              })}
            </div>
            <label className="text-foreground-muted flex items-center gap-2 text-xs">
              Altura do ponto
              <select
                className={`${input} w-auto`}
                value={height}
                onChange={(e) => setHeight(e.target.value as BayPoint["height"])}
              >
                <option value="low">Baixo</option>
                <option value="mid">Médio</option>
                <option value="high">Alto</option>
              </select>
              <span>● = ponto de verificação de fluido</span>
            </label>
            {figure ? (
              <div
                className="border-copper/40 relative cursor-crosshair overflow-hidden rounded-xl border"
                onClick={onFigureClick}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- imagem local (blob:), nunca publicada */}
                <img
                  src={figure}
                  alt="Figura do cofre carregada para marcar os pontos"
                  className="block w-full select-none"
                  draggable={false}
                />
                {c.points.map((p) => (
                  <span
                    key={p.item}
                    title={p.label}
                    style={{ left: `${p.x * 100}%`, top: `${(1 - p.depth) * 100}%` }}
                    className={`pointer-events-none absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                      BAY_ITEM_FLUID[p.item]
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-white bg-black/70 text-white"
                    }`}
                  >
                    {p.figureRef}
                  </span>
                ))}
              </div>
            ) : (
              <div className="border-copper/40 text-foreground-muted flex aspect-[2/1] items-center justify-center rounded-xl border border-dashed text-sm">
                A figura aparece aqui (fica só no seu navegador).
              </div>
            )}
            <ul className="text-foreground-muted text-xs">
              {[...c.points]
                .sort((a, b) => a.figureRef - b.figureRef)
                .map((p) => (
                  <li key={p.item} className="flex items-center gap-2">
                    <span className="text-foreground">{p.figureRef}.</span> {p.label} — x {p.x},
                    profundidade {p.depth}, {p.height}
                    <button
                      type="button"
                      className="text-accent ml-auto"
                      onClick={() =>
                        set((d) => void (d.points = d.points.filter((x) => x.item !== p.item)))
                      }
                    >
                      remover
                    </button>
                  </li>
                ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-2 text-sm font-semibold">
              {(["plan", "3d"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={preview === v}
                  onClick={() => setPreview(v)}
                  className={`min-h-9 rounded-full px-4 ${preview === v ? "bg-accent text-accent-foreground" : "text-foreground-muted border-copper/50 border"}`}
                >
                  {v === "plan" ? "Prévia: planta" : "Prévia: 3D"}
                </button>
              ))}
            </div>
            {preview === "plan" ? (
              <EngineBayPlan
                plan={{
                  title: c.layout.title || "Cofre",
                  engine: planEngine(sheet),
                  parts: planParts(sheet),
                }}
              >
                {planHotspots(sheet).map((h) => (
                  <Hotspot
                    key={h.fluidType}
                    x={h.x}
                    y={h.y}
                    label={FLUID_LABEL[h.fluidType] ?? h.fluidType}
                    glyph={<FluidIcon fluidKey={h.fluidType} className="text-accent h-4 w-4" />}
                  />
                ))}
              </EngineBayPlan>
            ) : (
              <div
                className="border-copper/40 relative w-full overflow-hidden rounded-[1.75rem] border bg-[radial-gradient(ellipse_at_50%_30%,#2a2420_0%,#11100f_70%)]"
                style={{ aspectRatio: "1 / 1" }}
              >
                <EngineBay3D
                  scene={scene}
                  fluids={TRACKED_FLUIDS.map((f) => ({ code: f.code, label: f.label }))}
                  selected={null}
                  onSelect={() => {}}
                />
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section title="3. Fluidos">
        <div className="flex flex-col gap-2">
          <textarea
            className={`${input} min-h-28`}
            placeholder="Cole aqui o texto das páginas de fluidos, capacidades e plano de manutenção do manual."
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
          />
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await draftFluids(c.engine.code, sourceText);
                if (r.ok) {
                  applyDraft(r.draft);
                  setMessage({
                    ok: true,
                    text: "Rascunho aplicado nos campos vazios. Confira cada valor com a citação abaixo.",
                  });
                } else setMessage({ ok: false, text: r.error });
              })
            }
            className={`${buttonClasses("secondary")} min-h-10 self-start px-4 text-sm`}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {pending ? "Gerando…" : "Gerar rascunho com IA"}
          </button>
          {draft ? (
            <details className="text-foreground-muted text-xs" open>
              <summary className="text-foreground cursor-pointer font-semibold">
                De onde a IA tirou cada valor
              </summary>
              <ul className="mt-2 flex flex-col gap-1">
                {draft.fluids.map((f, i) => (
                  <li key={i}>
                    <strong className="text-foreground">
                      {FLUID_LABEL[f.fluidType] ?? f.fluidType}:
                    </strong>{" "}
                    “{f.sourceQuote}”
                  </li>
                ))}
                {draft.uncertain.map((u, i) => (
                  <li key={`u${i}`} className="text-warning">
                    Incerto: {u}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {c.fluids.map((f, i) => (
            <FluidForm
              key={f.fluidType}
              fluid={f}
              onChange={(fn) => set((d) => fn(d.fluids[i]!))}
            />
          ))}
        </div>
      </Section>

      <Section title="4. Conferir e salvar">
        {errors.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm">
            {errors.map((e) => (
              <li key={e} className="text-warning flex items-start gap-2">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {e}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#4cc38a]">
            Tudo preenchido. Confira o arquivo no diff antes de publicar.
          </p>
        )}
        <button
          type="button"
          disabled={pending || errors.length > 0}
          onClick={() =>
            start(async () => {
              const r = await saveCuration(c);
              setMessage(
                r.ok
                  ? {
                      ok: true,
                      text: (
                        <>
                          Salvo em <code>{r.file}</code>. Para publicar: revise o diff, rode{" "}
                          <code>pnpm db:seed &amp;&amp; pnpm db:relink</code> e faça o commit.
                        </>
                      ),
                    }
                  : { ok: false, text: r.errors.join(" ") },
              );
            })
          }
          className={`${buttonClasses("primary", "lg")} mt-3 self-start px-6 disabled:opacity-50`}
        >
          {pending ? "Salvando…" : "Salvar arquivo de curadoria"}
        </button>
        {message ? (
          <p
            role="status"
            className={`mt-3 text-sm ${message.ok ? "text-foreground" : "text-warning"}`}
          >
            {message.text}
          </p>
        ) : null}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-copper/40 bg-surface-low/60 flex flex-col gap-3 rounded-2xl border p-5">
      <h2 className="font-heading text-foreground-strong text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-foreground-muted text-xs font-medium">{label}</span>
      {children}
    </label>
  );
}

const NUM_FIELDS: [keyof CurationFluid, string][] = [
  ["volumeMl", "Capacidade (mL)"],
  ["volumeWithFilterMl", "Com filtro (mL)"],
  ["volumeWithAcMl", "Com ar-cond. (mL)"],
  ["intervalKm", "Troca (km)"],
  ["intervalMonths", "Troca (meses)"],
  ["checkIntervalKm", "Verificar a cada (km)"],
];

function FluidForm({
  fluid,
  onChange,
}: {
  fluid: CurationFluid;
  onChange: (fn: (f: CurationFluid) => void) => void;
}) {
  return (
    <fieldset className="border-border flex flex-col gap-2 rounded-xl border p-4">
      <legend className="text-foreground-strong flex items-center gap-2 px-1 text-sm font-semibold">
        <FluidIcon fluidKey={fluid.fluidType} className="text-accent h-4 w-4" />
        {FLUID_LABEL[fluid.fluidType]}
      </legend>
      <Field label="Especificação">
        <input
          className={input}
          value={fluid.specification}
          onChange={(e) => onChange((f) => void (f.specification = e.target.value))}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Field label="Viscosidade">
          <input
            className={input}
            value={fluid.viscosity ?? ""}
            onChange={(e) => onChange((f) => void (f.viscosity = e.target.value || null))}
          />
        </Field>
        {NUM_FIELDS.map(([k, label]) => (
          <Field key={k} label={label}>
            <input
              className={input}
              type="number"
              value={(fluid[k] as number | null) ?? ""}
              onChange={(e) =>
                onChange(
                  (f) =>
                    void ((f[k] as number | null) = e.target.value ? Number(e.target.value) : null),
                )
              }
            />
          </Field>
        ))}
      </div>
      <Field label="Avisos (aparecem para o usuário)">
        <input
          className={input}
          value={fluid.warnings ?? ""}
          onChange={(e) => onChange((f) => void (f.warnings = e.target.value || null))}
        />
      </Field>
      <Field label="Páginas da fonte">
        <input
          className={input}
          value={fluid.pages}
          placeholder="p.170 (verificação), p.231 (capacidade)"
          onChange={(e) => onChange((f) => void (f.pages = e.target.value))}
        />
      </Field>
    </fieldset>
  );
}
