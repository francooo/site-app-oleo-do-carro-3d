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

// ---------------------------------------------------------------------------
// Status derivado dos registros (maintenance_records). Não existe tabela de
// status: "Em dia/Verificar/Atenção" sai sempre destas regras.
// ---------------------------------------------------------------------------

export type CheckResult = "ok" | "baixo_completei" | "baixo_nao_completei";

export const CHECK_RESULT_LABEL: Record<CheckResult, string> = {
  ok: "Nível certo",
  baixo_completei: "Estava baixo e completei",
  baixo_nao_completei: "Está baixo e não completei",
};

export type FluidEvent = {
  date: Date;
  km: number | null;
  kind: "verificacao" | "complemento" | "troca";
  checkResult: CheckResult | null;
};

export type FluidIntervals = {
  /** Troca: km e/ou meses (fonte curada). */
  intervalKm: number | null;
  intervalMonths: number | null;
  /** Verificação de nível em km (fonte curada, ex.: Uno a cada 500 km). */
  checkIntervalKm: number | null;
};

/**
 * Sugestão geral do app (não é dado de fabricante): sem registro há mais
 * de 30 dias, vale conferir o nível de novo. Exibida como "sugestão do app".
 */
export const DEFAULT_CHECK_INTERVAL_DAYS = 30;
/** "Verificar" quando a troca atingir 90% do intervalo. */
const CHANGE_SOON_RATIO = 0.9;
const DAY_MS = 86_400_000;

export type DerivedStatus = { status: FluidStatus; reason: string | null };

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/** Fração (0..∞) do intervalo de troca já consumida — o maior entre km e tempo. */
function changeProgress(
  lastChange: FluidEvent,
  intervals: FluidIntervals,
  currentKm: number | null,
  now: Date,
) {
  const ratios: number[] = [];
  if (intervals.intervalMonths != null) {
    const due = addMonths(lastChange.date, intervals.intervalMonths).getTime();
    const span = due - lastChange.date.getTime();
    ratios.push((now.getTime() - lastChange.date.getTime()) / span);
  }
  if (intervals.intervalKm != null && lastChange.km != null && currentKm != null) {
    ratios.push((currentKm - lastChange.km) / intervals.intervalKm);
  }
  return ratios.length ? Math.max(...ratios) : 0;
}

export function deriveFluidStatus(input: {
  /** Último evento que informa o nível (verificação, complemento ou troca). */
  lastLevelEvent: FluidEvent | null;
  /** Última troca registrada. */
  lastChange: FluidEvent | null;
  intervals: FluidIntervals;
  currentKm: number | null;
  now?: Date;
}): DerivedStatus {
  const { lastLevelEvent, lastChange, intervals, currentKm, now = new Date() } = input;
  if (!lastLevelEvent && !lastChange) return { status: "nao_informado", reason: null };

  const progress = lastChange ? changeProgress(lastChange, intervals, currentKm, now) : 0;

  if (
    lastLevelEvent?.kind === "verificacao" &&
    lastLevelEvent.checkResult === "baixo_nao_completei"
  ) {
    return { status: "atencao", reason: "Nível abaixo do mínimo" };
  }
  if (progress >= 1) return { status: "atencao", reason: "Troca vencida" };

  if (lastLevelEvent) {
    const days = (now.getTime() - lastLevelEvent.date.getTime()) / DAY_MS;
    const kmSince =
      currentKm != null && lastLevelEvent.km != null ? currentKm - lastLevelEvent.km : null;
    if (
      intervals.checkIntervalKm != null &&
      kmSince != null &&
      kmSince >= intervals.checkIntervalKm
    ) {
      return { status: "verificar", reason: "Hora de conferir o nível" };
    }
    if (days > DEFAULT_CHECK_INTERVAL_DAYS) {
      return { status: "verificar", reason: "Hora de conferir o nível" };
    }
  }
  if (progress >= CHANGE_SOON_RATIO) return { status: "verificar", reason: "Troca próxima" };

  return { status: "em_dia", reason: null };
}

const NO_INTERVALS: FluidIntervals = {
  intervalKm: null,
  intervalMonths: null,
  checkIntervalKm: null,
};

export type FluidStatusEntry = DerivedStatus & {
  code: string;
  /** Data da última verificação/complemento/troca (card "Última verificação"). */
  lastCheckAt: Date | null;
};

/**
 * Status de cada fluido de UM veículo a partir dos eventos dele (mais
 * recentes primeiro) e dos intervalos curados (vazio para carro sem curadoria).
 */
export function statusForFluids(
  codes: readonly string[],
  events: readonly (FluidEvent & { fluidType: string })[],
  intervalsByFluid: Partial<Record<string, FluidIntervals>>,
  currentKm: number | null,
  now = new Date(),
): FluidStatusEntry[] {
  return codes.map((code) => {
    const mine = events.filter((e) => e.fluidType === code);
    const lastLevelEvent = mine[0] ?? null;
    const lastChange = mine.find((e) => e.kind === "troca") ?? null;
    return {
      code,
      lastCheckAt: lastLevelEvent?.date ?? null,
      ...deriveFluidStatus({
        lastLevelEvent,
        lastChange,
        intervals: intervalsByFluid[code] ?? NO_INTERVALS,
        currentKm,
        now,
      }),
    };
  });
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
