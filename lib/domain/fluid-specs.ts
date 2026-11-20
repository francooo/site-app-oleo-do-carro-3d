// Formatação de capacidades e intervalos — pura, reaproveitável no Expo.

const liters = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});
const integer = new Intl.NumberFormat("pt-BR");

/** 2700 → "2,7 L"; 430 → "0,43 L". */
export function formatLiters(ml: number) {
  return `${liters.format(ml / 1000)} L`;
}

export type CapacityFluid = {
  volumeMl: number | null;
  volumeWithFilterMl: number | null;
  volumeWithAcMl: number | null;
};

export type Capacity = {
  /** Texto principal ("2,7 L com filtro"). */
  value: string;
  /** Ressalva quando a capacidade depende de algo que não sabemos. */
  note?: string;
};

/**
 * Escolhe a capacidade certa para o carro. Arrefecimento muda com
 * aquecedor/ar-condicionado — sem saber, mostra as duas e avisa.
 */
export function pickCapacity(
  fluid: CapacityFluid,
  hasAirConditioning: boolean | null,
): Capacity | null {
  if (fluid.volumeWithFilterMl != null) {
    return { value: `${formatLiters(fluid.volumeWithFilterMl)} com filtro` };
  }
  if (fluid.volumeMl == null) return null;
  if (fluid.volumeWithAcMl == null) return { value: formatLiters(fluid.volumeMl) };

  if (hasAirConditioning === true) {
    return { value: `${formatLiters(fluid.volumeWithAcMl)} (com aquecedor/ar)` };
  }
  if (hasAirConditioning === false) {
    return { value: `${formatLiters(fluid.volumeMl)} (sem aquecedor/ar)` };
  }
  return {
    value: `${formatLiters(fluid.volumeMl)} ou ${formatLiters(fluid.volumeWithAcMl)}`,
    note: "Depende de o carro ter aquecedor ou ar-condicionado — informe isso nos dados do carro.",
  };
}

/** "15.000 km ou 12 meses" / "a cada 24 meses" / null. */
export function formatChangeInterval(intervalKm: number | null, intervalMonths: number | null) {
  const parts = [
    intervalKm != null ? `${integer.format(intervalKm)} km` : null,
    intervalMonths != null ? `${intervalMonths} meses` : null,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return `A cada ${parts.join(" ou ")}${parts.length > 1 ? " (o que vier primeiro)" : ""}`;
}

export function formatKm(km: number) {
  return `${integer.format(km)} km`;
}
