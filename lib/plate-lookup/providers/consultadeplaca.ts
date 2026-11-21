// Fornecedor principal: Consulta de Placa (consultadeplaca.net), API v1.
// Referência: .claude/skills/consulta-de-placa-api/SKILL.md — só endpoints e
// campos documentados lá. Usamos apenas a consulta básica (POST /lookups),
// que não traz dados do proprietário (LGPD). Nunca usar POST /reports aqui.

import {
  displacementFromName,
  displayMake,
  displayModel,
  type FipeVersion,
  mapProviderFuel,
  type PlateLookupOutcome,
} from "@/lib/domain/plate-vehicle";

import { type FetchLike, type PlateLookupProvider, retryAfterMs, sleep } from "../provider";

const BASE = "https://consultadeplaca.net/api/v1";
const TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS = 3;
/** Repetir com a MESMA Idempotency-Key (seção 7 da skill). */
const RETRY_SAME_KEY = new Set(["idempotency_in_progress", "rate_limited", "internal_error"]);
const QUOTA_CODES = new Set(["insufficient_balance", "daily_limit_exceeded"]);

type CdpVehicle = {
  plate?: string;
  brand?: string;
  model?: string | null;
  version?: string | null;
  manufacture_year?: number | null;
  model_year?: number | null;
  fuel?: string | null;
  fipe?: {
    code?: string | null;
    versions?:
      | {
          code: string;
          version: string | null;
          fuel: string | null;
          score: number | null;
        }[]
      | null;
  } | null;
};

type CdpLookup = {
  id?: string;
  status?: string;
  result?: "found" | "not_found" | "unavailable" | null;
  vehicle?: CdpVehicle | null;
};

/** Resposta `found` da API → formato do app. Exportada para os testes. */
export function mapCdpVehicle(plate: string, v: CdpVehicle) {
  const make = displayMake(v.brand ?? "");
  const fipeVersions: FipeVersion[] = (v.fipe?.versions ?? [])
    .filter((fv) => fv.code)
    .map((fv) => ({
      code: fv.code,
      name: fv.version ?? "",
      fuel: mapProviderFuel(fv.fuel),
      score: fv.score ?? null,
    }));
  const best = fipeVersions[0];
  return {
    plate,
    make,
    model: displayModel(v.model ?? v.version ?? "", v.brand),
    version: v.version ?? best?.name ?? null,
    manufactureYear: v.manufacture_year ?? null,
    modelYear: v.model_year ?? v.manufacture_year ?? null,
    fuel: mapProviderFuel(v.fuel) ?? best?.fuel ?? null,
    // A consulta não tem campo de cilindrada: só o nome da versão diz.
    engineDisplacement: displacementFromName(v.version) ?? displacementFromName(v.model),
    fipeCode: v.fipe?.code ?? best?.code ?? null,
    fipeVersions,
  };
}

export function createConsultaDePlacaProvider(
  opts: { apiKey?: string; fetch?: FetchLike; retryDelayMs?: number } = {},
): PlateLookupProvider {
  const apiKey = () => opts.apiKey ?? process.env.CDP_API_KEY;
  const doFetch: FetchLike = opts.fetch ?? fetch;
  const delay = opts.retryDelayMs ?? 1_000;

  return {
    name: "consultadeplaca",
    isConfigured: () => !!apiKey(),
    async lookup(plate): Promise<PlateLookupOutcome> {
      const key = apiKey();
      if (!key) return { status: "not_configured" };

      const idempotencyKey = crypto.randomUUID();
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        let res: Response;
        try {
          res = await doFetch(`${BASE}/lookups`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              Accept: "application/json",
              "Content-Type": "application/json",
              "Idempotency-Key": idempotencyKey,
            },
            body: JSON.stringify({ plate }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
            cache: "no-store",
          });
        } catch {
          // Conexão caiu ou timeout: tenta de novo com a mesma chave.
          await sleep(delay * 2 ** attempt);
          continue;
        }

        const body = (await res.json().catch(() => ({ code: "internal_error" }))) as CdpLookup & {
          code?: string;
          detail?: string;
          request_id?: string;
        };
        const requestId = res.headers.get("x-request-id") ?? body.request_id ?? null;

        if (res.status === 201) {
          if (body.result === "found" && body.vehicle) {
            return {
              status: "found",
              vehicle: mapCdpVehicle(plate, body.vehicle),
              providerLookupId: body.id ?? null,
              requestId,
            };
          }
          if (body.result === "not_found") {
            return {
              status: "not_found",
              providerLookupId: body.id ?? null,
              requestId,
            };
          }
          return {
            status: "unavailable",
            detail: `resultado inesperado (${requestId})`,
          };
        }

        const code = body.code ?? `http_${res.status}`;
        if (RETRY_SAME_KEY.has(code) || (res.status >= 500 && res.status !== 503 && !body.code)) {
          await sleep(retryAfterMs(res, delay * 2 ** attempt));
          continue;
        }
        if (QUOTA_CODES.has(code) || res.status === 402) {
          return { status: "quota_exceeded", detail: `${code} (${requestId})` };
        }
        // 503 (nada cobrado), 401/403/422 e afins: não repetir — a cadeia
        // segue para o próximo fornecedor ou para o cadastro manual.
        return { status: "unavailable", detail: `${code} (${requestId})` };
      }
      return {
        status: "unavailable",
        detail: "sem resposta após novas tentativas",
      };
    },
  };
}
