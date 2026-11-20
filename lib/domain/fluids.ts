// Fluidos do painel "Como está o seu carro?" (Início). Códigos iguais a
// `fluid_types.code` (drizzle/seed.ts); sem Next/DOM/DB — reaproveitável no Expo.
export const DASHBOARD_FLUIDS = [
  { code: "oil", label: "Óleo do motor" },
  { code: "brake", label: "Fluido de freio" },
  { code: "coolant", label: "Arrefecimento" },
] as const;

export type DashboardFluidCode = (typeof DASHBOARD_FLUIDS)[number]["code"];
