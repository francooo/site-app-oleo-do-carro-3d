// Regras puras de status de fluido — sem Next/DOM/DB, reaproveitáveis pelo
// futuro app Expo (ver docs/MOBILE-PARIDADE.md).

export const FLUID_STATUSES = ["em_dia", "verificar", "atencao", "nao_informado"] as const;
export type FluidStatus = (typeof FLUID_STATUSES)[number];

export const FLUID_STATUS_LABEL: Record<FluidStatus, string> = {
  em_dia: "Em dia",
  verificar: "Verificar",
  atencao: "Atenção",
  nao_informado: "Não informado",
};

/** Ordem de gravidade, para ordenar listas e resumir um veículo. */
const SEVERITY: Record<FluidStatus, number> = {
  atencao: 3,
  verificar: 2,
  nao_informado: 1,
  em_dia: 0,
};

export function compareBySeverity(a: FluidStatus, b: FluidStatus) {
  return SEVERITY[b] - SEVERITY[a];
}

/** Itens que pedem ação do usuário (tudo que não está "Em dia"). */
export function countPending(statuses: readonly FluidStatus[]) {
  return statuses.filter((s) => s === "verificar" || s === "atencao").length;
}

/** Resumo de um veículo para o card da garagem. */
export function summarizeVehicle(statuses: readonly FluidStatus[]): {
  status: FluidStatus;
  label: string;
} {
  if (statuses.length === 0 || statuses.every((s) => s === "nao_informado")) {
    return { status: "nao_informado", label: "Status não informado" };
  }
  const pending = countPending(statuses);
  if (pending === 0) return { status: "em_dia", label: "Tudo em dia" };
  const worst = [...statuses].sort(compareBySeverity)[0]!;
  return {
    status: worst,
    label: pending === 1 ? "1 item para verificar" : `${pending} itens para verificar`,
  };
}
