import { describe, expect, it } from "vitest";

import {
  joinFieldLabels,
  missingConfirmationFields,
  parseVehicleInput,
  vehicleDisplayName,
  vehicleEngineLabel,
  vehicleImageKey,
  vehicleYearOptions,
} from "./vehicle";

const NOW = new Date("2026-06-01T12:00:00Z");

function form(values: Record<string, string>) {
  return (key: string) => values[key] ?? null;
}

const UNO = {
  make: "Fiat",
  model: "Uno",
  year: "2016",
  version: "Way",
  engineDisplacement: "1.0",
  fuel: "flex",
  hasAirConditioning: "sim",
  currentKm: "85.000",
};

describe("parseVehicleInput", () => {
  it("aceita o cadastro completo do piloto", () => {
    const result = parseVehicleInput(form(UNO), NOW);
    expect(result).toEqual({
      ok: true,
      data: {
        make: "Fiat",
        model: "Uno",
        year: 2016,
        version: "Way",
        engineDisplacement: "1.0",
        fuel: "flex",
        hasAirConditioning: true,
        currentKm: 85000,
        plate: null,
      },
    });
  });

  it("deixa opcionais como null", () => {
    const result = parseVehicleInput(form({ make: "Fiat", model: "Uno", year: "2016" }), NOW);
    expect(result.ok && result.data).toMatchObject({
      version: null,
      engineDisplacement: null,
      fuel: null,
      hasAirConditioning: null,
      currentKm: null,
    });
  });

  it("exige marca e modelo", () => {
    expect(parseVehicleInput(form({ ...UNO, make: "  " }), NOW).ok).toBe(false);
  });

  it("rejeita ano fora da faixa", () => {
    expect(parseVehicleInput(form({ ...UNO, year: "2028" }), NOW).ok).toBe(false);
    expect(parseVehicleInput(form({ ...UNO, year: "1979" }), NOW).ok).toBe(false);
    expect(parseVehicleInput(form({ ...UNO, year: "2027" }), NOW).ok).toBe(true);
  });

  it("rejeita combustível e motorização fora do formato", () => {
    expect(parseVehicleInput(form({ ...UNO, fuel: "querosene" }), NOW).ok).toBe(false);
    expect(parseVehicleInput(form({ ...UNO, engineDisplacement: "1000" }), NOW).ok).toBe(false);
  });

  it("rejeita quilometragem negativa", () => {
    expect(parseVehicleInput(form({ ...UNO, currentKm: "-5" }), NOW).ok).toBe(false);
  });

  it("interpreta ar-condicionado sim/não/não sei", () => {
    const ac = (v: string) => {
      const r = parseVehicleInput(form({ ...UNO, hasAirConditioning: v }), NOW);
      return r.ok ? r.data.hasAirConditioning : "erro";
    };
    expect(ac("sim")).toBe(true);
    expect(ac("nao")).toBe(false);
    expect(ac("")).toBe(null);
  });
});

describe("rótulos", () => {
  it("monta nome e motorização", () => {
    expect(vehicleDisplayName({ make: "Fiat", model: "Uno", year: 2016 })).toBe("Fiat Uno 2016");
    expect(vehicleEngineLabel({ engineDisplacement: "1.0", fuel: "flex" })).toBe("1.0 Flex");
    expect(vehicleEngineLabel({ engineDisplacement: null, fuel: null })).toBe("");
  });

  it("lista anos do mais novo ao mais antigo", () => {
    const years = vehicleYearOptions(NOW);
    expect(years[0]).toBe(2027);
    expect(years.at(-1)).toBe(1980);
  });
});

describe("missingConfirmationFields", () => {
  it("aponta versão, motorização e combustível ausentes", () => {
    const missing = missingConfirmationFields({ make: "Fiat", model: "Uno", year: 2016 });
    expect(missing).toEqual(["version", "engineDisplacement", "fuel"]);
    expect(joinFieldLabels(missing)).toBe("versão, motorização e combustível");
  });

  it("fica vazio quando o carro está completo", () => {
    expect(
      missingConfirmationFields({
        make: "Fiat",
        model: "Uno",
        year: 2016,
        version: "Way",
        engineDisplacement: "1.0",
        fuel: "flex",
      }),
    ).toEqual([]);
  });
});

describe("vehicleImageKey", () => {
  it("reconhece o Uno do piloto, sem diferenciar maiúsculas", () => {
    expect(vehicleImageKey({ make: "FIAT", model: "uno way" })).toBe("fiat-uno");
    expect(vehicleImageKey({ make: "Fiat", model: "Unox" })).toBe(null);
    expect(vehicleImageKey({ make: "Volkswagen", model: "Gol" })).toBe(null);
  });
});
