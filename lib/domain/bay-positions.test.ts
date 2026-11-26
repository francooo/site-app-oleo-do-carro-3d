import { describe, expect, it } from "vitest";

import { fluidCheckPoints } from "./bay-positions";
import { BAY_POSITION_SHEETS, getBayPositionSheet } from "./bay-sheets";
import { TRACKED_FLUIDS } from "./fluids";

describe("fichas de posições do cofre", () => {
  it.each(BAY_POSITION_SHEETS.map((s) => [s.layoutCode, s] as const))(
    "%s: coordenadas dentro do cofre e itens únicos",
    (_code, sheet) => {
      for (const p of sheet.points) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(1);
        expect(p.depth).toBeGreaterThanOrEqual(0);
        expect(p.depth).toBeLessThanOrEqual(1);
      }
      const items = sheet.points.map((p) => p.item);
      expect(new Set(items).size).toBe(items.length);
      const refs = sheet.points.map((p) => p.figureRef);
      expect(new Set(refs).size).toBe(refs.length);
    },
  );

  it.each(BAY_POSITION_SHEETS.map((s) => [s.layoutCode, s] as const))(
    "%s: tem o ponto de verificação dos 4 fluidos acompanhados",
    (_code, sheet) => {
      const fluids = fluidCheckPoints(sheet).map((c) => c.fluid);
      expect([...fluids].sort()).toEqual(TRACKED_FLUIDS.map((f) => f.code).sort());
    },
  );

  it("Onix Turbo bate com o texto do manual", () => {
    const sheet = getBayPositionSheet("chevrolet-onix-turbo-2020")!;
    const at = (item: string) => sheet.points.find((p) => p.item === item)!;
    // p.175: expansão "no lado do passageiro" = esquerda de quem olha de frente.
    expect(at("coolant").x).toBeLessThan(0.5);
    // p.173: filtro de ar "no lado do motorista" = direita de quem olha de frente.
    expect(at("air_filter").x).toBeGreaterThan(0.5);
    // Figura p.167: freio junto ao painel, à direita do motor.
    expect(at("brake").depth).toBeGreaterThan(0.8);
    expect(at("brake").x).toBeGreaterThan(at("oil_cap").x);
    // Vareta (3) à esquerda da tampa do óleo (4) no Turbo.
    expect(at("oil_dipstick").x).toBeLessThan(at("oil_cap").x);
  });

  it("layout desconhecido não tem ficha", () => {
    expect(getBayPositionSheet("nao-existe")).toBeNull();
    expect(getBayPositionSheet(null)).toBeNull();
  });
});
