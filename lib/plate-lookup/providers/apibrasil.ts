// Fornecedor de reserva: APIBrasil, "Agregados com Versão" (tipo
// "agregados-propria"). Doc: https://doc.apibrasil.io/apis/creditos/316e4578-3212-48db-9170-5a37ae855166.md
// Traz a cilindrada em cc (melhor que o principal), mas não o código FIPE do
// modelo. Com APIBRASIL_HOMOLOG=true responde dados fictícios sem cobrar.
// Erros podem vir com HTTP 200 e `error: true` — sempre conferir.

import {
  displacementFromCc,
  displacementFromName,
  displayMake,
  displayModel,
  mapProviderFuel,
  type PlateLookupOutcome,
} from "@/lib/domain/plate-vehicle";

import type { FetchLike, PlateLookupProvider } from "../provider";

const URL_CREDITS = "https://gateway.apibrasil.io/api/v2/consulta/veiculos/credits";
const TIMEOUT_MS = 20_000;

type ApiBrasilData = {
  marca?: string | null;
  modelo?: string | null;
  versao?: string | null;
  ano_fabricacao?: number | string | null;
  ano_modelo?: number | string | null;
  combustivel?: string | null;
  cilindradas?: number | string | null;
  motor_descricao?: string | null;
  modeloDetalhes?: { nome?: string | null } | null;
};

type ApiBrasilResponse = {
  error?: boolean;
  message?: string;
  data?: ApiBrasilData | null;
};

const toYear = (v: number | string | null | undefined) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 1900 ? n : null;
};

const NOT_FOUND_RE = /n[aã]o (foi )?encontrad|sem (registro|dados)|inexistente/i;

/** `data` da APIBrasil → formato do app. Exportada para os testes. */
export function mapApiBrasilData(plate: string, d: ApiBrasilData) {
  const rawModel = d.modelo ?? d.modeloDetalhes?.nome ?? "";
  const make = displayMake(d.marca ?? "");
  const version = d.versao?.trim() || null;
  return {
    plate,
    make,
    model: displayModel(rawModel, d.marca ?? undefined),
    // "1.0 FLEX 12V 4P" sozinho diz pouco; junta com o modelo para exibir.
    version: version ? `${displayModel(rawModel, d.marca ?? undefined)} ${version}` : null,
    manufactureYear: toYear(d.ano_fabricacao),
    modelYear: toYear(d.ano_modelo) ?? toYear(d.ano_fabricacao),
    fuel: mapProviderFuel(d.combustivel),
    engineDisplacement:
      displacementFromCc(d.cilindradas) ??
      displacementFromName(version) ??
      displacementFromName(d.motor_descricao),
    fipeCode: null,
    fipeVersions: [],
  };
}

export function createApiBrasilProvider(
  opts: { token?: string; homolog?: boolean; fetch?: FetchLike } = {},
): PlateLookupProvider {
  const token = () => opts.token ?? process.env.APIBRASIL_TOKEN;
  const homolog = () => opts.homolog ?? process.env.APIBRASIL_HOMOLOG === "true";
  const doFetch: FetchLike = opts.fetch ?? fetch;

  return {
    name: "apibrasil",
    isConfigured: () => !!token(),
    async lookup(plate): Promise<PlateLookupOutcome> {
      const t = token();
      if (!t) return { status: "not_configured" };

      let res: Response;
      try {
        res = await doFetch(URL_CREDITS, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${t}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            tipo: "agregados-propria",
            placa: plate,
            homolog: homolog(),
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
          cache: "no-store",
        });
      } catch {
        return { status: "unavailable", detail: "falha de conexão" };
      }

      if (res.status === 402) return { status: "quota_exceeded", detail: "saldo insuficiente" };
      const body = (await res.json().catch(() => null)) as ApiBrasilResponse | null;
      if (!res.ok || !body) return { status: "unavailable", detail: `http_${res.status}` };

      if (body.error === false && body.data?.marca) {
        return { status: "found", vehicle: mapApiBrasilData(plate, body.data) };
      }
      if (body.message && NOT_FOUND_RE.test(body.message)) return { status: "not_found" };
      if (body.message && /saldo/i.test(body.message)) {
        return { status: "quota_exceeded", detail: body.message };
      }
      return {
        status: "unavailable",
        detail: body.message ?? "resposta sem dados",
      };
    },
  };
}
