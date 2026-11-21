import { describe, expect, it, vi } from "vitest";

import type { PlateLookupOutcome } from "@/lib/domain/plate-vehicle";

import { configuredProviderOrder, lookupPlateWithProviders } from "./chain";
import { enrichFromFipe } from "./fipe";
import type { FetchLike, PlateLookupProvider } from "./provider";
import { createApiBrasilProvider } from "./providers/apibrasil";
import { createConsultaDePlacaProvider } from "./providers/consultadeplaca";

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });

// Exemplo da documentação (skill consulta-de-placa-api, POST /lookups 201).
const CDP_FOUND = {
  object: "lookup",
  id: "lkp_01JA0Q3B5C7D9E1F3G5H7J9K1M",
  status: "completed",
  plate: "TST0001",
  result: "found",
  price: { amount: "0.00", currency: "BRL" },
  free: false,
  vehicle: {
    plate: "TST0001",
    brand: "FIAT",
    model: "UNO",
    version: "Uno Mille Economy 1.0 Flex 4p",
    manufacture_year: 2012,
    model_year: 2013,
    color: "PRATA",
    fuel: "ALCOOL/GASOLINA",
    type: "AUTOMOVEL",
    city: "FORTALEZA",
    state: "CE",
    theft: false,
    fipe: {
      code: "001177-0",
      amount: "18000.00",
      versions: [
        {
          code: "001177-0",
          version: "Uno Mille Economy 1.0 Flex 4p",
          amount: "18000.00",
          fuel: "Flex",
          score: 72,
        },
        {
          code: "001235-1",
          version: "Uno Mille Way Economy 1.0 Flex 4p",
          amount: "19500.00",
          fuel: "Flex",
          score: 61,
        },
      ],
    },
  },
};

describe("consultadeplaca", () => {
  const provider = (fetchImpl: ReturnType<typeof vi.fn>) =>
    createConsultaDePlacaProvider({
      apiKey: "cdp_test_x",
      fetch: fetchImpl as unknown as FetchLike,
      retryDelayMs: 1,
    });

  it("encontrada: mapeia para o formato do app, sem cidade/cor", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(201, CDP_FOUND, { "x-request-id": "req_1" }));
    const r = await provider(fetchImpl).lookup("TST0001");
    expect(r.status).toBe("found");
    if (r.status !== "found") return;
    expect(r.vehicle).toEqual({
      plate: "TST0001",
      make: "Fiat",
      model: "Uno",
      version: "Uno Mille Economy 1.0 Flex 4p",
      manufactureYear: 2012,
      modelYear: 2013,
      fuel: "flex",
      engineDisplacement: "1.0",
      fipeCode: "001177-0",
      fipeVersions: [
        {
          code: "001177-0",
          name: "Uno Mille Economy 1.0 Flex 4p",
          fuel: "flex",
          score: 72,
        },
        {
          code: "001235-1",
          name: "Uno Mille Way Economy 1.0 Flex 4p",
          fuel: "flex",
          score: 61,
        },
      ],
    });
    expect(r.providerLookupId).toBe(CDP_FOUND.id);
    expect(r.requestId).toBe("req_1");

    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("https://consultadeplaca.net/api/v1/lookups");
    expect(init.headers.Authorization).toBe("Bearer cdp_test_x");
    expect(init.headers["Idempotency-Key"]).toMatch(/^[0-9a-f-]{36}$/);
    expect(String(url)).not.toContain("cdp_test_x");
  });

  it("não encontrada (TST0002)", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(json(201, { ...CDP_FOUND, result: "not_found", vehicle: null }));
    expect((await provider(fetchImpl).lookup("TST0002")).status).toBe("not_found");
  });

  it("503 (TST0003) → indisponível, sem repetir", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(json(503, { code: "service_unavailable", request_id: "req_x" }));
    expect((await provider(fetchImpl).lookup("TST0003")).status).toBe("unavailable");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("402 → sem saldo", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(402, { code: "insufficient_balance" }));
    expect((await provider(fetchImpl).lookup("ABC1D23")).status).toBe("quota_exceeded");
  });

  it("429 repete com a MESMA Idempotency-Key", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json(429, { code: "rate_limited" }, { "retry-after": "0" }))
      .mockResolvedValueOnce(json(201, CDP_FOUND));
    const r = await provider(fetchImpl).lookup("TST0001");
    expect(r.status).toBe("found");
    const keys = fetchImpl.mock.calls.map((c) => c[1].headers["Idempotency-Key"]);
    expect(keys[0]).toBe(keys[1]);
  });

  it("401/403 não repetem", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(403, { code: "test_plate_required" }));
    expect((await provider(fetchImpl).lookup("ABC1D23")).status).toBe("unavailable");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("sem chave → não configurado, sem chamar a rede", async () => {
    const fetchImpl = vi.fn();
    const p = createConsultaDePlacaProvider({ apiKey: "", fetch: fetchImpl });
    expect(p.isConfigured()).toBe(false);
    expect((await p.lookup("ABC1D23")).status).toBe("not_configured");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("apibrasil", () => {
  const provider = (fetchImpl: ReturnType<typeof vi.fn>) =>
    createApiBrasilProvider({
      token: "tok",
      homolog: true,
      fetch: fetchImpl as unknown as FetchLike,
    });

  it("encontrada: cilindrada em cc vira 1.0", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      json(200, {
        error: false,
        message: "Consulta realizada",
        data: {
          marca: "FIAT",
          modelo: "UNO VIVACE",
          versao: "1.0 FLEX 8V 4P",
          ano_fabricacao: 2015,
          ano_modelo: 2016,
          combustivel: "ALCOOL/GASOLINA",
          cilindradas: 999,
          cor: "BRANCA",
          chassi: "9BD000000000000",
        },
      }),
    );
    const r = await provider(fetchImpl).lookup("ABC1234");
    expect(r.status).toBe("found");
    if (r.status !== "found") return;
    expect(r.vehicle).toMatchObject({
      make: "Fiat",
      model: "Uno Vivace",
      version: "Uno Vivace 1.0 FLEX 8V 4P",
      modelYear: 2016,
      fuel: "flex",
      engineDisplacement: "1.0",
      fipeCode: null,
    });
    expect(r.vehicle).not.toHaveProperty("chassi");
    const body = JSON.parse(fetchImpl.mock.calls[0]![1].body);
    expect(body).toEqual({
      tipo: "agregados-propria",
      placa: "ABC1234",
      homolog: true,
    });
  });

  it("erro com HTTP 200 (error: true) não é sucesso", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(json(200, { error: true, message: "Placa não encontrada" }));
    expect((await provider(fetchImpl).lookup("ABC1234")).status).toBe("not_found");
  });

  it("402 → sem saldo", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(402, { error: true }));
    expect((await provider(fetchImpl).lookup("ABC1234")).status).toBe("quota_exceeded");
  });
});

describe("cadeia de fornecedores", () => {
  const fake = (
    name: "consultadeplaca" | "apibrasil",
    outcome: PlateLookupOutcome,
    configured = true,
  ): PlateLookupProvider & { calls: number } => {
    const p = {
      name,
      calls: 0,
      isConfigured: () => configured,
      lookup: async () => {
        p.calls++;
        return outcome;
      },
    };
    return p;
  };
  const found: PlateLookupOutcome = {
    status: "found",
    vehicle: {
      plate: "ABC1D23",
      make: "Fiat",
      model: "Uno",
      version: null,
      manufactureYear: 2016,
      modelYear: 2016,
      fuel: "flex",
      engineDisplacement: "1.0",
      fipeCode: null,
      fipeVersions: [],
    },
  };

  it("principal encontrou → reserva não é chamada", async () => {
    const a = fake("consultadeplaca", found);
    const b = fake("apibrasil", found);
    const r = await lookupPlateWithProviders("ABC1D23", [a, b]);
    expect(r.provider).toBe("consultadeplaca");
    expect(b.calls).toBe(0);
  });

  it("indisponível ou sem saldo → tenta a reserva", async () => {
    for (const status of ["unavailable", "quota_exceeded"] as const) {
      const r = await lookupPlateWithProviders("ABC1D23", [
        fake("consultadeplaca", { status }),
        fake("apibrasil", found),
      ]);
      expect(r).toMatchObject({
        provider: "apibrasil",
        outcome: { status: "found" },
      });
    }
  });

  it("não encontrada no principal → tenta a reserva; ninguém achou → not_found", async () => {
    const b = fake("apibrasil", found);
    expect(
      (await lookupPlateWithProviders("X", [fake("consultadeplaca", { status: "not_found" }), b]))
        .provider,
    ).toBe("apibrasil");
    const r = await lookupPlateWithProviders("X", [
      fake("consultadeplaca", { status: "not_found" }),
      fake("apibrasil", { status: "unavailable" }),
    ]);
    expect(r).toMatchObject({
      provider: "consultadeplaca",
      outcome: { status: "not_found" },
    });
  });

  it("pula fornecedor sem chave; nenhum configurado → not_configured", async () => {
    const a = fake("consultadeplaca", found, false);
    const r = await lookupPlateWithProviders("X", [a, fake("apibrasil", found)]);
    expect(a.calls).toBe(0);
    expect(r.provider).toBe("apibrasil");
    expect(
      (await lookupPlateWithProviders("X", [fake("consultadeplaca", found, false)])).outcome.status,
    ).toBe("not_configured");
  });

  it("ordem configurável por PLATE_PROVIDERS", () => {
    expect(configuredProviderOrder("apibrasil, consultadeplaca,xpto")).toEqual([
      "apibrasil",
      "consultadeplaca",
    ]);
    expect(configuredProviderOrder(undefined)).toEqual(["consultadeplaca", "apibrasil"]);
  });
});

describe("enrichFromFipe", () => {
  const base = {
    plate: "ABC1D23",
    make: "Fiat",
    model: "Uno",
    version: null,
    manufactureYear: 2015,
    modelYear: 2016,
    fuel: null,
    engineDisplacement: null,
    fipeCode: "001267-0",
    fipeVersions: [],
  };

  it("completa versão, combustível e cilindrada pelo código FIPE", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json(200, [{ code: "2016-1", name: "2016 Gasolina" }]))
      .mockResolvedValueOnce(
        json(200, {
          model: "Uno Vivace 1.0 EVO Fire Flex 8V 5p",
          fuel: "Flex",
          modelYear: 2016,
        }),
      );
    const r = await enrichFromFipe(base, { fetch: fetchImpl });
    expect(r).toMatchObject({
      version: "Uno Vivace 1.0 EVO Fire Flex 8V 5p",
      fuel: "flex",
      engineDisplacement: "1.0",
    });
    expect(fetchImpl.mock.calls[0]![0]).toBe(
      "https://fipe.parallelum.com.br/api/v2/cars/001267-0/years",
    );
  });

  it("falha na FIPE não atrapalha", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("offline"));
    expect(await enrichFromFipe(base, { fetch: fetchImpl })).toEqual(base);
  });

  it("já completo ou sem código → não chama", async () => {
    const fetchImpl = vi.fn();
    await enrichFromFipe({ ...base, fipeCode: null }, { fetch: fetchImpl });
    await enrichFromFipe({ ...base, version: "x", fuel: "flex" }, { fetch: fetchImpl });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
