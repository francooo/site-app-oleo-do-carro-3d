// Vincula um veículo cadastrado a um motor curado — regra pura (sem DB),
// reaproveitável no Expo. Regra de conteúdo §4: dado técnico é por veículo
// e versão, nunca só pelo nome comercial; na dúvida, NÃO vincula.

import type { FuelType } from "./vehicle";

export type TrimCandidate = {
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  /** Combustível da combinação curada (null = qualquer). */
  fuelType: FuelType | null;
  engineId: string;
  /** Cilindrada do motor, ex.: "1.0" (numeric do Postgres vem como string). */
  displacement: string | null;
  /** Aspiração do motor curado (null = a fonte não distingue). */
  aspiration?: Aspiration | null;
  isPrimary: boolean;
};

/** Mesmo enum `aspiration` do banco. */
export type Aspiration = "naturally_aspirated" | "turbo" | "supercharged" | "hybrid";

export type MatchInput = {
  make: string;
  model: string;
  year: number;
  engineDisplacement: string | null;
  fuel: FuelType | null;
  /** Nome da versão (FIPE ou digitado): é onde aparece "TB", "Turbo", "TSI"… */
  version?: string | null;
};

// Marcas de turbo nos nomes de versão FIPE/comerciais: "1.0 12V TB Flex",
// "1.0 Turbo", "200 TSI", "1.0 TGDI", "T200", "T270".
const TURBO_MARKER = /\b(tb|turbo|tsi|tgdi|t-?gdi|t200|t270|tfsi|ecoboost)\b/;

/**
 * "turbo" quando o nome da versão diz que é turbo; null quando não diz.
 * A ausência da marca NÃO prova que é aspirado (versão digitada "LTZ").
 */
export function aspirationFromVersion(version: string | null | undefined): "turbo" | null {
  if (!version) return null;
  return TURBO_MARKER.test(normalize(version)) ? "turbo" : null;
}

/**
 * Mesma cilindrada pode ser turbo ou aspirada (Onix 1.0 e 1.0 Turbo). Motor
 * turbo só vincula com a marca de turbo na versão; motor aspirado nunca
 * vincula com ela. Motor sem aspiração curada (piloto Uno) não filtra.
 */
function aspirationMatches(engine: Aspiration | null | undefined, vehicle: "turbo" | null) {
  if (engine === "turbo") return vehicle === "turbo";
  if (engine === "naturally_aspirated") return vehicle !== "turbo";
  return true;
}

export type MatchResult =
  { status: "confirmed"; engineId: string } | { status: "unmatched"; engineId: null };

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

/** "1.0" e "1.00" são a mesma cilindrada. */
const sameDisplacement = (a: string, b: string) => Number(a) === Number(b);

export function matchEngine(
  vehicle: MatchInput,
  candidates: readonly TrimCandidate[],
): MatchResult {
  // Sem motorização ou combustível não dá para afirmar qual é o motor.
  if (!vehicle.engineDisplacement || !vehicle.fuel) return { status: "unmatched", engineId: null };

  const make = normalize(vehicle.make);
  // "Uno Way", "Uno Vivace" → começa com o modelo curado.
  const model = normalize(vehicle.model);
  const aspiration = aspirationFromVersion(vehicle.version);

  const matches = candidates.filter(
    (c) =>
      normalize(c.make) === make &&
      (model === normalize(c.model) || model.startsWith(`${normalize(c.model)} `)) &&
      vehicle.year >= c.yearFrom &&
      vehicle.year <= c.yearTo &&
      (c.fuelType === null || c.fuelType === vehicle.fuel) &&
      c.displacement !== null &&
      sameDisplacement(c.displacement, vehicle.engineDisplacement!) &&
      aspirationMatches(c.aspiration, aspiration),
  );

  const engineIds = [...new Set(matches.map((m) => m.engineId))];
  if (engineIds.length === 1) return { status: "confirmed", engineId: engineIds[0]! };
  // Mais de um motor possível: só confirma se houver um primário claro.
  const primary = [...new Set(matches.filter((m) => m.isPrimary).map((m) => m.engineId))];
  if (primary.length === 1) return { status: "confirmed", engineId: primary[0]! };
  return { status: "unmatched", engineId: null };
}
