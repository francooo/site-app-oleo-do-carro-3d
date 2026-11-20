// Fluidos acompanhados pelo app. Códigos iguais a `fluid_types.code`
// (drizzle/seed.ts); sem Next/DOM/DB — reaproveitável no Expo.

export const TRACKED_FLUIDS = [
  { code: "oil", label: "Óleo do motor", shortLabel: "óleo" },
  { code: "brake", label: "Fluido de freio", shortLabel: "fluido de freio" },
  { code: "coolant", label: "Arrefecimento", shortLabel: "arrefecimento" },
  { code: "washer", label: "Limpador de para-brisa", shortLabel: "limpador" },
] as const;

export type TrackedFluidCode = (typeof TRACKED_FLUIDS)[number]["code"];

/** Painel "Como está o seu carro?" do Início (3 cards, como no mockup). */
export const DASHBOARD_FLUIDS = TRACKED_FLUIDS.filter((f) => f.code !== "washer");

export function isTrackedFluid(code: string): code is TrackedFluidCode {
  return TRACKED_FLUIDS.some((f) => f.code === code);
}

export function fluidLabel(code: TrackedFluidCode) {
  return TRACKED_FLUIDS.find((f) => f.code === code)!.label;
}
