// Regras puras de veículo — sem Next/DOM/DB, reaproveitáveis pelo futuro app
// Expo (ver docs/MOBILE-PARIDADE.md).

/** Mesmos valores do enum `fuel_type` do banco (lib/db/schema.ts). */
export const FUEL_TYPES = ["flex", "gasoline", "ethanol", "diesel", "hybrid", "electric"] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

/** Rótulo completo (seletor e tela de confirmação). */
export const FUEL_LABEL: Record<FuelType, string> = {
  flex: "Gasolina e etanol (flex)",
  gasoline: "Gasolina",
  ethanol: "Etanol",
  diesel: "Diesel",
  hybrid: "Híbrido",
  electric: "Elétrico",
};

/** Rótulo curto para o subtítulo do card ("1.0 Flex"). */
export const FUEL_SHORT_LABEL: Record<FuelType, string> = {
  flex: "Flex",
  gasoline: "Gasolina",
  ethanol: "Etanol",
  diesel: "Diesel",
  hybrid: "Híbrido",
  electric: "Elétrico",
};

/** Cilindradas oferecidas no seletor de motorização. */
export const ENGINE_DISPLACEMENTS = [
  "1.0",
  "1.2",
  "1.3",
  "1.4",
  "1.5",
  "1.6",
  "1.8",
  "2.0",
  "2.2",
  "2.4",
  "2.8",
  "3.0",
] as const;

/** Marcas sugeridas no campo Marca (o usuário pode digitar outra). */
export const COMMON_MAKES = [
  "Chevrolet",
  "Citroën",
  "Fiat",
  "Ford",
  "Honda",
  "Hyundai",
  "Jeep",
  "Nissan",
  "Peugeot",
  "Renault",
  "Toyota",
  "Volkswagen",
] as const;

export const MIN_VEHICLE_YEAR = 1980;

export function maxVehicleYear(now = new Date()) {
  return now.getFullYear() + 1;
}

/** Anos do seletor, do mais novo para o mais antigo. */
export function vehicleYearOptions(now = new Date()) {
  const years: number[] = [];
  for (let y = maxVehicleYear(now); y >= MIN_VEHICLE_YEAR; y--) years.push(y);
  return years;
}

export type VehicleIdentity = {
  make: string;
  model: string;
  year: number;
  version?: string | null;
  engineDisplacement?: string | null;
  fuel?: FuelType | null;
};

/** "Fiat Uno 2016". */
export function vehicleDisplayName(v: Pick<VehicleIdentity, "make" | "model" | "year">) {
  return `${v.make} ${v.model} ${v.year}`;
}

/** "1.0 Flex" — vazio quando nada foi informado. */
export function vehicleEngineLabel(v: Pick<VehicleIdentity, "engineDisplacement" | "fuel">) {
  return [v.engineDisplacement, v.fuel ? FUEL_SHORT_LABEL[v.fuel] : null].filter(Boolean).join(" ");
}

export const CONFIRMATION_FIELD_LABEL = {
  version: "versão",
  engineDisplacement: "motorização",
  fuel: "combustível",
} as const;
export type ConfirmationField = keyof typeof CONFIRMATION_FIELD_LABEL;

/**
 * Campos que faltam para carregar dados técnicos com segurança. Regra de
 * conteúdo §4: fluido é por veículo e versão, nunca só pelo nome comercial —
 * a confirmação avisa quando versão ou motorização estão incompletas.
 */
export function missingConfirmationFields(v: VehicleIdentity): ConfirmationField[] {
  const missing: ConfirmationField[] = [];
  if (!v.version?.trim()) missing.push("version");
  if (!v.engineDisplacement?.trim()) missing.push("engineDisplacement");
  if (!v.fuel) missing.push("fuel");
  return missing;
}

/** "versão e motorização" / "versão, motorização e combustível". */
export function joinFieldLabels(fields: readonly ConfirmationField[]) {
  const labels = fields.map((f) => CONFIRMATION_FIELD_LABEL[f]);
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} e ${labels.at(-1)}`;
}

export type VehicleInput = {
  make: string;
  model: string;
  year: number;
  version: string | null;
  engineDisplacement: string | null;
  fuel: FuelType | null;
  hasAirConditioning: boolean | null;
  currentKm: number | null;
  /** Placa sem normalização; quem persiste normaliza (lib/plate.ts). */
  plate: string | null;
};

export type ParseResult = { ok: true; data: VehicleInput } | { ok: false; error: string };

/**
 * Valida o formulário de veículo (tela 01). Recebe um getter para funcionar
 * com FormData (web) e com objetos simples (API / Expo).
 */
export function parseVehicleInput(get: (key: string) => unknown, now = new Date()): ParseResult {
  const text = (key: string) => {
    const value = get(key);
    const s = typeof value === "string" ? value.trim() : "";
    return s.length > 0 ? s : null;
  };

  const make = text("make");
  const model = text("model");
  if (!make || !model) return { ok: false, error: "Informe a marca e o modelo do carro." };
  if (make.length > 40 || model.length > 60) {
    return { ok: false, error: "Marca ou modelo muito longos." };
  }

  const year = Number(text("year"));
  if (!Number.isInteger(year) || year < MIN_VEHICLE_YEAR || year > maxVehicleYear(now)) {
    return { ok: false, error: "Selecione o ano do carro." };
  }

  const version = text("version");
  if (version && version.length > 60) return { ok: false, error: "Versão muito longa." };

  const engineDisplacement = text("engineDisplacement");
  if (engineDisplacement && !/^\d\.\d$/.test(engineDisplacement)) {
    return { ok: false, error: "Motorização inválida. Use o formato 1.0, 1.6…" };
  }

  const fuelRaw = text("fuel");
  if (fuelRaw && !(FUEL_TYPES as readonly string[]).includes(fuelRaw)) {
    return { ok: false, error: "Combustível inválido." };
  }
  const fuel = fuelRaw as FuelType | null;

  const acRaw = text("hasAirConditioning");
  const hasAirConditioning = acRaw === "sim" ? true : acRaw === "nao" ? false : null;

  const kmRaw = text("currentKm");
  let currentKm: number | null = null;
  if (kmRaw) {
    currentKm = Number(kmRaw.replace(/\./g, ""));
    if (!Number.isInteger(currentKm) || currentKm < 0 || currentKm > 2_000_000) {
      return { ok: false, error: "Quilometragem inválida." };
    }
  }

  return {
    ok: true,
    data: {
      make,
      model,
      year,
      version,
      engineDisplacement,
      fuel,
      hasAirConditioning,
      currentKm,
      plate: text("plate"),
    },
  };
}

/** Chave da imagem ilustrativa do carro, quando existe uma curada. */
export function vehicleImageKey(v: Pick<VehicleIdentity, "make" | "model">) {
  const make = v.make.trim().toLowerCase();
  const model = v.model.trim().toLowerCase();
  if (make === "fiat" && /^uno\b/.test(model)) return "fiat-uno";
  return null;
}
