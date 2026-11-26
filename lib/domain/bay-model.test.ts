import { describe, expect, it } from "vitest";

import {
  getLayoutVisuals,
  planEngine,
  planHotspots,
  planParts,
  planPosition,
  sceneFromSheet,
} from "./bay-model";
import { BAY_POSITION_SHEETS, getBayPositionSheet } from "./bay-positions";
import { fillPointAnchor } from "./engine-scene";
import { TRACKED_FLUIDS } from "./fluids";

const ONIX = getBayPositionSheet("chevrolet-onix-turbo-2020")!;
const FLUID_CODES = TRACKED_FLUIDS.map((f) => f.code).sort();

describe("planta 2D", () => {
  it("painel fica em cima e para-choque embaixo; esquerda × direita preservados", () => {
    const back = planPosition({ x: 0, depth: 1 });
    const front = planPosition({ x: 1, depth: 0 });
    expect(back.top).toBeLessThan(front.top);
    expect(back.left).toBeLessThan(front.left);
  });

  it.each(BAY_POSITION_SHEETS.map((s) => [s.layoutCode, s] as const))(
    "%s: um ponto por fluido, dentro da planta",
    (_code, sheet) => {
      const hs = planHotspots(sheet);
      expect(hs.map((h) => h.fluidType).sort()).toEqual(FLUID_CODES);
      for (const h of hs) {
        expect(h.x).toBeGreaterThan(5);
        expect(h.x).toBeLessThan(95);
        expect(h.y).toBeGreaterThan(5);
        expect(h.y).toBeLessThan(95);
      }
      // Peças de contexto não viram ponto clicável.
      expect(planParts(sheet).every((p) => !hs.some((h) => h.description === p.label))).toBe(true);
    },
  );

  it("motor do Onix fica entre a vareta e a tampa do óleo", () => {
    const e = planEngine(ONIX);
    const dip = planHotspots(ONIX).find((h) => h.fluidType === "oil")!;
    expect(Math.abs(e.left - dip.x)).toBeLessThan(e.width / 2);
  });
});

describe("cena 3D gerada", () => {
  it.each(BAY_POSITION_SHEETS.map((s) => [s.layoutCode, s] as const))(
    "%s: os 4 fluidos, com marcadores dentro do cofre",
    (_code, sheet) => {
      const scene = sceneFromSheet(sheet);
      expect(scene.fillPoints.map((p) => p.fluid).sort()).toEqual(FLUID_CODES);
      for (const p of scene.fillPoints) {
        const [x, y, z] = fillPointAnchor(p);
        expect(Math.abs(x)).toBeLessThan(0.88);
        expect(Math.abs(z)).toBeLessThan(0.68);
        expect(y).toBeGreaterThan(0);
        expect(y).toBeLessThan(0.7);
      }
      const ids = scene.parts.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    },
  );

  it("Onix: arrefecimento laranja do manual, à esquerda; freio ao fundo", () => {
    const scene = sceneFromSheet(ONIX);
    const coolant = scene.fillPoints.find((p) => p.fluid === "coolant")!;
    const brake = scene.fillPoints.find((p) => p.fluid === "brake")!;
    expect(coolant.kind === "tank" && coolant.liquidColor).toBe("#f08a3c");
    expect(coolant.position[0]).toBeLessThan(0);
    expect(brake.position[2]).toBeLessThan(-0.4);
  });
});

describe("getLayoutVisuals", () => {
  it("Uno mantém a cena feita à mão; Onix usa a gerada", () => {
    expect(getLayoutVisuals("fiat-uno-2016").scene?.layoutCode).toBe("fiat-uno-2016");
    expect(getLayoutVisuals("fiat-uno-2016").sheet).toBeNull();
    const onix = getLayoutVisuals("chevrolet-onix-turbo-2020");
    expect(onix.sheet).not.toBeNull();
    expect(onix.scene?.fillPoints).toHaveLength(4);
  });

  it("layout desconhecido não tem visual", () => {
    expect(getLayoutVisuals("nao-existe")).toEqual({ sheet: null, scene: null });
  });
});
