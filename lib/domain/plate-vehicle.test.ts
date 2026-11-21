import { describe, expect, it } from "vitest";

import {
  displacementFromCc,
  displacementFromName,
  displayMake,
  displayModel,
  type FipeVersion,
  mapProviderFuel,
  pickFipeVersion,
  plateVehicleTitle,
} from "./plate-vehicle";

describe("mapProviderFuel", () => {
  it("converte os formatos do cadastro e da FIPE", () => {
    expect(mapProviderFuel("ALCOOL/GASOLINA")).toBe("flex");
    expect(mapProviderFuel("Flex")).toBe("flex");
    expect(mapProviderFuel("GASOLINA")).toBe("gasoline");
    expect(mapProviderFuel("Álcool")).toBe("ethanol");
    expect(mapProviderFuel("DIESEL")).toBe("diesel");
    expect(mapProviderFuel("ELETRICO")).toBe("electric");
    expect(mapProviderFuel("HIBRIDO")).toBe("hybrid");
  });

  it("desconhecido ou vazio → null", () => {
    expect(mapProviderFuel("GAS NATURAL")).toBeNull();
    expect(mapProviderFuel("")).toBeNull();
    expect(mapProviderFuel(null)).toBeNull();
  });
});

describe("cilindrada", () => {
  it("de cc para o rótulo do app", () => {
    expect(displacementFromCc(999)).toBe("1.0");
    expect(displacementFromCc(1368)).toBe("1.4");
    expect(displacementFromCc(1598)).toBe("1.6");
    expect(displacementFromCc("1998")).toBe("2.0");
    expect(displacementFromCc(1.6)).toBe("1.6");
  });

  it("valor fora do seletor ou inválido → null", () => {
    expect(displacementFromCc(6200)).toBeNull();
    expect(displacementFromCc(0)).toBeNull();
    expect(displacementFromCc(null)).toBeNull();
  });

  it("pelo nome da versão", () => {
    expect(displacementFromName("Uno Vivace 1.0 EVO Fire Flex 8V 5p")).toBe("1.0");
    expect(displacementFromName("Corolla XEi 2.0 Flex 16V Aut.")).toBe("2.0");
    expect(displacementFromName("SPIN 1.8L MT LT")).toBe("1.8");
  });

  it("sem número ou com dois diferentes → null (não inventa)", () => {
    expect(displacementFromName("Uno Mille Economy")).toBeNull();
    expect(displacementFromName("Kit 1.0 ou 1.4")).toBeNull();
    expect(displacementFromName(null)).toBeNull();
  });
});

describe("exibição", () => {
  it("marca", () => {
    expect(displayMake("FIAT")).toBe("Fiat");
    expect(displayMake("VW")).toBe("Volkswagen");
    expect(displayMake("CITROEN")).toBe("Citroën");
    expect(displayMake("GM - CHEVROLET")).toBe("Chevrolet");
    expect(displayMake("CAOA CHERY")).toBe("Caoa Chery");
  });

  it("modelo do cadastro vira o nome comercial", () => {
    expect(displayModel("UNO", "FIAT")).toBe("Uno");
    expect(displayModel("FIAT/UNO VIVACE 1.0", "FIAT")).toBe("Uno Vivace");
    expect(displayModel("SPIN 1.8L MT LT")).toBe("Spin");
    expect(displayModel("ONIX 10MT LT")).toBe("Onix");
    expect(displayModel("PEUGEOT/208 ACTIVE 1.2")).toBe("208 Active");
  });

  it("título da tela de confirmação", () => {
    expect(
      plateVehicleTitle({
        make: "Fiat",
        model: "Uno Vivace",
        engineDisplacement: "1.0",
        fuel: "flex",
        modelYear: 2016,
      }),
    ).toBe("Fiat Uno Vivace 1.0 Flex 2016");
  });
});

describe("pickFipeVersion", () => {
  const v = (code: string, name: string, score: number): FipeVersion => ({
    code,
    name,
    fuel: "flex",
    score,
  });

  it("sem versões → nada escolhido", () => {
    expect(pickFipeVersion({ versions: [] })).toEqual({
      chosen: null,
      ambiguous: false,
      options: [],
    });
  });

  it("uma versão bem à frente → escolhida sem perguntar", () => {
    const r = pickFipeVersion({
      versions: [v("A", "Corolla XEi 2.0 Flex 16V Aut.", 100), v("B", "Corolla GLi 2.0", 49)],
    });
    expect(r.chosen?.code).toBe("A");
    expect(r.ambiguous).toBe(false);
  });

  it("notas próximas → pergunta ao usuário", () => {
    const r = pickFipeVersion({
      versions: [
        v("LTA", "Spin LT 1.8 Aut.", 52),
        v("LTM", "Spin LT 1.8 Mec.", 47),
        v("LTZ", "Spin LTZ 1.8 Aut.", 47),
      ],
    });
    expect(r.ambiguous).toBe(true);
    expect(r.options.map((o) => o.code)).toEqual(["LTA", "LTM", "LTZ"]);
  });

  it("câmbio do cadastro desempata", () => {
    const r = pickFipeVersion({
      registryModel: "SPIN 1.8L MT LT",
      versions: [v("LTA", "Spin LT 1.8 Aut.", 52), v("LTM", "Spin LT 1.8 Mec.", 47)],
    });
    expect(r.chosen?.code).toBe("LTM");
    expect(r.ambiguous).toBe(false);
  });

  it("cilindrada conhecida filtra versões de outro motor", () => {
    const r = pickFipeVersion({
      engineDisplacement: "1.0",
      versions: [v("T", "Onix 1.0 Turbo Aut.", 60), v("N", "Onix 1.4 LT", 58)],
    });
    expect(r.chosen?.code).toBe("T");
    expect(r.ambiguous).toBe(false);
  });
});
