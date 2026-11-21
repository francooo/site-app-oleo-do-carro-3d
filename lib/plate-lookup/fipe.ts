// Complemento gratuito pela tabela FIPE (fipe.api.br / parallelum, v2).
// Só entra quando o fornecedor devolveu o código FIPE sem o nome da versão
// ou sem o combustível. Qualquer falha é ignorada: é só um complemento.
// Limites: 500/dia sem token, 1.000/dia com token grátis (FIPE_API_TOKEN).

import {
  displacementFromName,
  mapProviderFuel,
  type PlateVehicle,
} from "@/lib/domain/plate-vehicle";

import type { FetchLike } from "./provider";

const BASE = "https://fipe.parallelum.com.br/api/v2";
const TIMEOUT_MS = 8_000;

type FipeYear = { code: string; name: string };
type FipeDetail = {
  model?: string;
  fuel?: string;
  modelYear?: number;
  codeFipe?: string;
};

export async function enrichFromFipe(
  vehicle: PlateVehicle,
  opts: { fetch?: FetchLike; token?: string } = {},
): Promise<PlateVehicle> {
  if (!vehicle.fipeCode || (vehicle.version && vehicle.fuel)) return vehicle;

  const doFetch: FetchLike = opts.fetch ?? fetch;
  const token = opts.token ?? process.env.FIPE_API_TOKEN;
  const get = async <T>(path: string): Promise<T | null> => {
    try {
      const res = await doFetch(`${BASE}${path}`, {
        headers: {
          Accept: "application/json",
          ...(token ? { "X-Subscription-Token": token } : {}),
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        next: { revalidate: 86_400 },
      } as RequestInit);
      return res.ok ? ((await res.json()) as T) : null;
    } catch {
      return null;
    }
  };

  const code = encodeURIComponent(vehicle.fipeCode);
  const years = await get<FipeYear[]>(`/cars/${code}/years`);
  if (!years?.length) return vehicle;

  const sameYear = years.filter(
    (y) => vehicle.modelYear && y.code.startsWith(`${vehicle.modelYear}-`),
  );
  const year =
    sameYear.find((y) => !vehicle.fuel || mapProviderFuel(y.name) === vehicle.fuel) ?? sameYear[0];
  if (!year) return vehicle;

  const detail = await get<FipeDetail>(`/cars/${code}/years/${encodeURIComponent(year.code)}`);
  if (!detail?.model) return vehicle;

  return {
    ...vehicle,
    version: vehicle.version ?? detail.model,
    fuel: vehicle.fuel ?? mapProviderFuel(detail.fuel),
    engineDisplacement: vehicle.engineDisplacement ?? displacementFromName(detail.model),
  };
}
