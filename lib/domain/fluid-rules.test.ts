import { describe, expect, it } from "vitest";

import { CONTENT_ENGINE_CODES, getFluidContent } from "@/content/fluidos";

import { matchEngine, type TrimCandidate } from "./engine-match";
import { formatChangeInterval, formatLiters, pickCapacity } from "./fluid-specs";
import { deriveFluidStatus, type FluidEvent, summarizeVehicle } from "./fluid-status";
import { TRACKED_FLUIDS } from "./fluids";

const NOW = new Date("2026-06-15T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

const OIL = { intervalKm: 15000, intervalMonths: 12, checkIntervalKm: 500 };

function check(over: Partial<FluidEvent> = {}): FluidEvent {
  return { date: daysAgo(3), km: 85000, kind: "verificacao", checkResult: "ok", ...over };
}

describe("deriveFluidStatus", () => {
  it("sem registros → Não informado", () => {
    const r = deriveFluidStatus({
      lastLevelEvent: null,
      lastChange: null,
      intervals: OIL,
      currentKm: 85000,
      now: NOW,
    });
    expect(r.status).toBe("nao_informado");
  });

  it("verificação recente e ok → Em dia", () => {
    const r = deriveFluidStatus({
      lastLevelEvent: check(),
      lastChange: null,
      intervals: OIL,
      currentKm: 85100,
      now: NOW,
    });
    expect(r.status).toBe("em_dia");
  });

  it("baixo e não completei → Atenção", () => {
    const r = deriveFluidStatus({
      lastLevelEvent: check({ checkResult: "baixo_nao_completei" }),
      lastChange: null,
      intervals: OIL,
      currentKm: 85000,
      now: NOW,
    });
    expect(r).toEqual({ status: "atencao", reason: "Nível abaixo do mínimo" });
  });

  it("baixo mas completei → Em dia", () => {
    const r = deriveFluidStatus({
      lastLevelEvent: check({ checkResult: "baixo_completei" }),
      lastChange: null,
      intervals: OIL,
      currentKm: 85000,
      now: NOW,
    });
    expect(r.status).toBe("em_dia");
  });

  it("rodou 500 km desde a verificação → Verificar (regra do manual)", () => {
    const at = (km: number) =>
      deriveFluidStatus({
        lastLevelEvent: check(),
        lastChange: null,
        intervals: OIL,
        currentKm: km,
        now: NOW,
      }).status;
    expect(at(85499)).toBe("em_dia");
    expect(at(85500)).toBe("verificar");
  });

  it("mais de 30 dias sem verificar → Verificar (sugestão do app)", () => {
    const at = (days: number) =>
      deriveFluidStatus({
        lastLevelEvent: check({ date: daysAgo(days) }),
        lastChange: null,
        intervals: OIL,
        currentKm: null,
        now: NOW,
      }).status;
    expect(at(30)).toBe("em_dia");
    expect(at(31)).toBe("verificar");
  });

  it("troca: 90% do intervalo → Verificar; vencida → Atenção", () => {
    const change = (km: number, date = daysAgo(10)): FluidEvent => ({
      date,
      km,
      kind: "troca",
      checkResult: null,
    });
    const status = (lastChange: FluidEvent, currentKm: number) =>
      deriveFluidStatus({
        lastLevelEvent: check({ date: daysAgo(1), km: currentKm }),
        lastChange,
        intervals: OIL,
        currentKm,
        now: NOW,
      }).status;
    expect(status(change(70000), 83400)).toBe("em_dia"); // 89%
    expect(status(change(70000), 83500)).toBe("verificar"); // 90%
    expect(status(change(70000), 85000)).toBe("atencao"); // 100%
    // pelo tempo: 12 meses vencidos mesmo rodando pouco
    expect(status(change(84900, daysAgo(370)), 85000)).toBe("atencao");
  });

  it("intervalo só em meses (freio: 24 meses)", () => {
    const r = deriveFluidStatus({
      lastLevelEvent: check({ date: daysAgo(2) }),
      lastChange: { date: daysAgo(740), km: null, kind: "troca", checkResult: null },
      intervals: { intervalKm: null, intervalMonths: 24, checkIntervalKm: 500 },
      currentKm: null,
      now: NOW,
    });
    expect(r).toEqual({ status: "atencao", reason: "Troca vencida" });
  });

  it("alimenta o resumo da garagem", () => {
    expect(summarizeVehicle(["em_dia", "verificar", "atencao"]).label).toBe(
      "2 itens para verificar",
    );
  });
});

describe("matchEngine", () => {
  const CANDIDATES: TrimCandidate[] = [
    {
      make: "Fiat",
      model: "Uno",
      yearFrom: 2016,
      yearTo: 2016,
      fuelType: "flex",
      engineId: "engine-uno",
      displacement: "1.0",
      isPrimary: true,
    },
  ];
  const uno = {
    make: "Fiat",
    model: "Uno",
    year: 2016,
    engineDisplacement: "1.0",
    fuel: "flex" as const,
  };

  it("vincula o Uno 2016 1.0 Flex, inclusive com versão no nome", () => {
    expect(matchEngine(uno, CANDIDATES)).toEqual({ status: "confirmed", engineId: "engine-uno" });
    expect(matchEngine({ ...uno, make: "FIAT", model: "uno way" }, CANDIDATES).status).toBe(
      "confirmed",
    );
  });

  it("ignora acentos e maiúsculas na marca e no modelo", () => {
    expect(matchEngine({ ...uno, make: "Fíat", model: "Unô" }, CANDIDATES).status).toBe(
      "confirmed",
    );
  });

  it("não vincula outro ano, cilindrada, combustível ou modelo", () => {
    expect(matchEngine({ ...uno, year: 2015 }, CANDIDATES).status).toBe("unmatched");
    expect(matchEngine({ ...uno, engineDisplacement: "1.4" }, CANDIDATES).status).toBe("unmatched");
    expect(matchEngine({ ...uno, fuel: "gasoline" }, CANDIDATES).status).toBe("unmatched");
    expect(matchEngine({ ...uno, model: "Unonovo" }, CANDIDATES).status).toBe("unmatched");
  });

  it("não vincula sem motorização ou combustível informados", () => {
    expect(matchEngine({ ...uno, engineDisplacement: null }, CANDIDATES).status).toBe("unmatched");
    expect(matchEngine({ ...uno, fuel: null }, CANDIDATES).status).toBe("unmatched");
  });
});

describe("capacidades", () => {
  it("formata litros no padrão brasileiro", () => {
    expect(formatLiters(2700)).toBe("2,7 L");
    expect(formatLiters(430)).toBe("0,43 L");
  });

  it("arrefecimento depende do ar-condicionado", () => {
    const coolant = { volumeMl: 4900, volumeWithFilterMl: null, volumeWithAcMl: 5300 };
    expect(pickCapacity(coolant, true)?.value).toBe("5,3 L (com aquecedor/ar)");
    expect(pickCapacity(coolant, false)?.value).toBe("4,9 L (sem aquecedor/ar)");
    const unknown = pickCapacity(coolant, null);
    expect(unknown?.value).toBe("4,9 L ou 5,3 L");
    expect(unknown?.note).toBeTruthy();
  });

  it("óleo usa a capacidade com filtro; sem dado → null", () => {
    expect(
      pickCapacity({ volumeMl: null, volumeWithFilterMl: 2700, volumeWithAcMl: null }, null),
    ).toEqual({ value: "2,7 L com filtro" });
    expect(
      pickCapacity({ volumeMl: null, volumeWithFilterMl: null, volumeWithAcMl: null }, null),
    ).toBeNull();
  });

  it("formata intervalo de troca", () => {
    expect(formatChangeInterval(15000, 12)).toBe(
      "A cada 15.000 km ou 12 meses (o que vier primeiro)",
    );
    expect(formatChangeInterval(null, 24)).toBe("A cada 24 meses");
    expect(formatChangeInterval(null, null)).toBeNull();
  });
});

describe("conteúdo dos fluidos", () => {
  for (const engine of [null, ...CONTENT_ENGINE_CODES]) {
    for (const fluid of TRACKED_FLUIDS) {
      it(`${fluid.code} (${engine ?? "geral"}) tem passos, imagem e troca separada`, () => {
        const c = getFluidContent(fluid.code, engine);
        expect(c.steps.length).toBeGreaterThanOrEqual(3);
        expect(c.steps.every((s) => s.title && s.image)).toBe(true);
        expect(c.changeInfo.length).toBeGreaterThan(10);
        expect(c.safety.length).toBeGreaterThan(0);
      });
    }
  }

  it("arrefecimento sempre alerta para não abrir quente", () => {
    const c = getFluidContent("coolant");
    expect(c.steps.some((s) => s.alert?.icon === "hot")).toBe(true);
  });
});
