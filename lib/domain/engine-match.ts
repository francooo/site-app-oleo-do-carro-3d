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
  isPrimary: boolean;
};

export type MatchInput = {
  make: string;
  model: string;
  year: number;
  engineDisplacement: string | null;
  fuel: FuelType | null;
};

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

  const matches = candidates.filter(
    (c) =>
      normalize(c.make) === make &&
      (model === normalize(c.model) || model.startsWith(`${normalize(c.model)} `)) &&
      vehicle.year >= c.yearFrom &&
      vehicle.year <= c.yearTo &&
      (c.fuelType === null || c.fuelType === vehicle.fuel) &&
      c.displacement !== null &&
      sameDisplacement(c.displacement, vehicle.engineDisplacement!),
  );

  const engineIds = [...new Set(matches.map((m) => m.engineId))];
  if (engineIds.length === 1) return { status: "confirmed", engineId: engineIds[0]! };
  // Mais de um motor possível: só confirma se houver um primário claro.
  const primary = [...new Set(matches.filter((m) => m.isPrimary).map((m) => m.engineId))];
  if (primary.length === 1) return { status: "confirmed", engineId: primary[0]! };
  return { status: "unmatched", engineId: null };
}
