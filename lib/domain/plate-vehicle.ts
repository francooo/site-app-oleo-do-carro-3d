// Regras puras do cadastro pela placa — sem Next/DOM/DB, reaproveitáveis
// pelo app Expo. Os provedores (lib/plate-lookup/providers/*) convertem a
// resposta de cada fornecedor para `PlateVehicle`; daqui em diante o app não
// sabe qual fornecedor respondeu.
//
// Regra de conteúdo §4: nunca inventar dado técnico. Cilindrada só vem de um
// campo numérico do fornecedor ou do nome da versão FIPE ("1.0"); se não der
// para afirmar, fica null e o usuário escolhe.

import { COMMON_MAKES, ENGINE_DISPLACEMENTS, FUEL_SHORT_LABEL, type FuelType } from "./vehicle";

export type FipeVersion = {
  code: string;
  name: string;
  fuel: FuelType | null;
  /** Semelhança com o modelo do cadastro (maior = mais provável). Não é %. */
  score: number | null;
};

export type PlateVehicle = {
  plate: string;
  make: string;
  model: string;
  /** Nome da versão FIPE (ex.: "Uno Vivace 1.0 EVO Fire Flex 8V 5p"). */
  version: string | null;
  manufactureYear: number | null;
  modelYear: number | null;
  fuel: FuelType | null;
  engineDisplacement: string | null;
  fipeCode: string | null;
  fipeVersions: FipeVersion[];
};

export type PlateLookupOutcome =
  | {
      status: "found";
      vehicle: PlateVehicle;
      providerLookupId?: string | null;
      requestId?: string | null;
    }
  | {
      status: "not_found";
      providerLookupId?: string | null;
      requestId?: string | null;
    }
  | { status: "unavailable"; detail?: string }
  | { status: "quota_exceeded"; detail?: string }
  | { status: "not_configured" };

// ---------------------------------------------------------------------------
// Combustível
// ---------------------------------------------------------------------------

const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toUpperCase();

/**
 * Texto de combustível do fornecedor → enum do app. Cobre o formato do
 * cadastro ("ALCOOL/GASOLINA", "GASOLINA", "DIESEL") e o da FIPE ("Flex",
 * "Gasolina", "Álcool"). Desconhecido → null (o usuário escolhe).
 */
export function mapProviderFuel(raw: string | null | undefined): FuelType | null {
  if (!raw) return null;
  const s = strip(raw);
  if (!s) return null;
  if (s.includes("FLEX")) return "flex";
  const hasGas = s.includes("GASOLINA");
  const hasEthanol = s.includes("ALCOOL") || s.includes("ETANOL");
  if (hasGas && hasEthanol) return "flex";
  if (s.includes("HIBRIDO") || s.includes("HYBRID")) return "hybrid";
  if (s.includes("ELETRIC")) return "electric";
  if (s.includes("DIESEL")) return "diesel";
  if (hasGas) return "gasoline";
  if (hasEthanol) return "ethanol";
  return null;
}

// ---------------------------------------------------------------------------
// Cilindrada
// ---------------------------------------------------------------------------

const KNOWN_DISPLACEMENTS = new Set<string>(ENGINE_DISPLACEMENTS);

/** 999 cc → "1.0"; 1368 → "1.4". Só aceita valores do seletor do app. */
export function displacementFromCc(cc: number | string | null | undefined): string | null {
  const n = typeof cc === "string" ? Number(cc.replace(",", ".")) : cc;
  if (n == null || !Number.isFinite(n) || n <= 0) return null;
  // Alguns fornecedores mandam litros (1.6) em vez de cc (1598).
  const liters = n < 20 ? n : n / 1000;
  const label = (Math.round(liters * 10) / 10).toFixed(1);
  return KNOWN_DISPLACEMENTS.has(label) ? label : null;
}

/** "Uno Vivace 1.0 EVO Fire Flex 8V" → "1.0". Ambíguo ou ausente → null. */
export function displacementFromName(name: string | null | undefined): string | null {
  if (!name) return null;
  const found = new Set(
    [...name.matchAll(/(?:^|[^\d.,])(\d)[.,](\d)(?![\d.,])/g)].map((m) => `${m[1]}.${m[2]}`),
  );
  const valid = [...found].filter((d) => KNOWN_DISPLACEMENTS.has(d));
  return valid.length === 1 ? valid[0]! : null;
}

// ---------------------------------------------------------------------------
// Versão FIPE
// ---------------------------------------------------------------------------

/** Notas dentro desta distância da melhor = o cadastro não distingue. */
const CLOSE_SCORE = 8;

function transmissionOf(text: string): "aut" | "mec" | null {
  const s = ` ${strip(text)} `;
  if (/\b(AUT\.?|AT|CVT|AUTOMATICO)\b/.test(s)) return "aut";
  if (/\b(MEC\.?|MT|MANUAL)\b/.test(s)) return "mec";
  return null;
}

export type FipeChoice = {
  chosen: FipeVersion | null;
  /** true = sobram versões parecidas; o usuário escolhe na confirmação. */
  ambiguous: boolean;
  /** Opções a mostrar (a escolhida primeiro). */
  options: FipeVersion[];
};

/**
 * Escolhe a versão FIPE mais provável (seção 6 da skill do fornecedor):
 * começa pela nota, filtra pela cilindrada e pelo câmbio que o modelo do
 * cadastro informar e, se ainda sobrar empate, devolve `ambiguous`.
 */
export function pickFipeVersion(input: {
  versions: readonly FipeVersion[];
  registryModel?: string | null;
  engineDisplacement?: string | null;
}): FipeChoice {
  let pool = [...input.versions].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  if (pool.length === 0) return { chosen: null, ambiguous: false, options: [] };

  const narrow = (pred: (v: FipeVersion) => boolean) => {
    const kept = pool.filter(pred);
    if (kept.length > 0) pool = kept;
  };

  const displacement = input.engineDisplacement ?? displacementFromName(input.registryModel);
  if (displacement) narrow((v) => displacementFromName(v.name) === displacement);

  const transmission = input.registryModel ? transmissionOf(input.registryModel) : null;
  if (transmission) narrow((v) => transmissionOf(v.name) === transmission);

  const best = pool[0]!;
  const close = pool.filter((v) => (best.score ?? 0) - (v.score ?? 0) <= CLOSE_SCORE);
  return {
    chosen: best,
    ambiguous: close.length > 1,
    options: close.length > 1 ? close : [best],
  };
}

// ---------------------------------------------------------------------------
// Exibição
// ---------------------------------------------------------------------------

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((w) => (/^\d/.test(w) || w.length <= 1 ? w : w[0]!.toUpperCase() + w.slice(1)))
    .join("");
}

const MAKE_ALIASES: Record<string, string> = {
  VW: "Volkswagen",
  "VW - VOLKSWAGEN": "Volkswagen",
  "GM - CHEVROLET": "Chevrolet",
  GM: "Chevrolet",
  CHEV: "Chevrolet",
  CITROEN: "Citroën",
  "MERCEDES-BENZ": "Mercedes-Benz",
  "M.BENZ": "Mercedes-Benz",
  BMW: "BMW",
};

/** "FIAT" → "Fiat"; "VW" → "Volkswagen"; desconhecida → Title Case. */
export function displayMake(raw: string): string {
  const s = strip(raw).replace(/\s+/g, " ");
  if (MAKE_ALIASES[s]) return MAKE_ALIASES[s]!;
  const known = COMMON_MAKES.find((m) => strip(m) === s);
  return known ?? titleCase(raw.trim());
}

/**
 * Modelo do cadastro → modelo curto do app. O cadastro às vezes vem como
 * "FIAT/UNO VIVACE 1.0": tira a marca e a motorização, mantém o nome
 * comercial ("Uno Vivace"). O `matchEngine` aceita "Uno Vivace" para "Uno".
 */
export function displayModel(raw: string, make?: string): string {
  let s = raw.trim();
  if (s.includes("/")) s = s.slice(s.indexOf("/") + 1);
  if (make) {
    const prefix = new RegExp(`^${strip(make).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i");
    s = s.replace(prefix, "");
  }
  // Corta a partir do primeiro termo técnico ("1.0", "10MT", "16V").
  s = s.replace(/\s+\d.*$/, "").trim();
  return titleCase(s || raw.trim());
}

/** "Fiat Uno Vivace 1.0 Flex 2016" — o título da tela "É este carro?". */
export function plateVehicleTitle(v: {
  make: string;
  model: string;
  engineDisplacement: string | null;
  fuel: FuelType | null;
  modelYear: number | null;
}) {
  return [
    v.make,
    v.model,
    v.engineDisplacement,
    v.fuel ? FUEL_SHORT_LABEL[v.fuel] : null,
    v.modelYear,
  ]
    .filter(Boolean)
    .join(" ");
}
