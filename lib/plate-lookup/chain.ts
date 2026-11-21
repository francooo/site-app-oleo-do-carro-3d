// Cadeia de fornecedores: tenta na ordem de PLATE_PROVIDERS e passa para o
// próximo quando um não está configurado, está fora do ar ou sem saldo.
// `not_found` do principal também tenta a reserva (as bases têm coberturas
// diferentes); se ninguém encontrar, o resultado é `not_found`.

import type { PlateLookupOutcome } from "@/lib/domain/plate-vehicle";

import { PLATE_PROVIDER_NAMES, type PlateLookupProvider, type PlateProviderName } from "./provider";
import { createApiBrasilProvider } from "./providers/apibrasil";
import { createConsultaDePlacaProvider } from "./providers/consultadeplaca";

export type ChainResult = {
  outcome: PlateLookupOutcome;
  provider: PlateProviderName | null;
};

const FACTORIES: Record<PlateProviderName, () => PlateLookupProvider> = {
  consultadeplaca: () => createConsultaDePlacaProvider(),
  apibrasil: () => createApiBrasilProvider(),
};

/** Lê PLATE_PROVIDERS ("consultadeplaca,apibrasil"), ignorando nomes desconhecidos. */
export function configuredProviderOrder(raw = process.env.PLATE_PROVIDERS): PlateProviderName[] {
  const names = (raw ?? "consultadeplaca,apibrasil")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is PlateProviderName => (PLATE_PROVIDER_NAMES as readonly string[]).includes(s));
  return [...new Set(names)];
}

export function defaultProviders(): PlateLookupProvider[] {
  return configuredProviderOrder().map((name) => FACTORIES[name]());
}

export async function lookupPlateWithProviders(
  plate: string,
  providers: readonly PlateLookupProvider[] = defaultProviders(),
): Promise<ChainResult> {
  let notFound: ChainResult | null = null;
  let lastFailure: ChainResult | null = null;

  for (const provider of providers) {
    if (!provider.isConfigured()) continue;
    const outcome = await provider.lookup(plate);
    if (outcome.status === "found") return { outcome, provider: provider.name };
    if (outcome.status === "not_found") {
      notFound ??= { outcome, provider: provider.name };
      continue;
    }
    if (outcome.status !== "not_configured") lastFailure = { outcome, provider: provider.name };
  }

  if (notFound) return notFound;
  if (lastFailure) return lastFailure;
  return { outcome: { status: "not_configured" }, provider: null };
}
