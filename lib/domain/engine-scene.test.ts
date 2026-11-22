import { describe, expect, it } from "vitest";

import { fillPointAnchor, getEngineScene, visibleFillPoints } from "./engine-scene";

describe("cena 3D do Uno", () => {
  const scene = getEngineScene("fiat-uno-2016")!;

  it("existe para o layout do piloto e não para layouts desconhecidos", () => {
    expect(scene).not.toBeNull();
    expect(getEngineScene("outro")).toBeNull();
    expect(getEngineScene(null)).toBeNull();
  });

  it("tem os 4 pontos do manual, um por fluido", () => {
    const codes = scene.fillPoints.map((p) => p.fluid).sort();
    expect(codes).toEqual(["brake", "coolant", "oil", "washer"]);
  });

  it("mesma disposição da foto: lavador e arrefecimento à esquerda, freio e óleo à direita", () => {
    const x = (f: string) => scene.fillPoints.find((p) => p.fluid === f)!.position[0];
    const z = (f: string) => scene.fillPoints.find((p) => p.fluid === f)!.position[2];
    expect(x("washer")).toBeLessThan(0);
    expect(x("coolant")).toBeLessThan(0);
    expect(x("brake")).toBeGreaterThan(0);
    expect(x("oil")).toBeGreaterThan(0);
    // Lavador e freio ficam junto à parede corta-fogo; arrefecimento mais à frente.
    expect(z("washer")).toBeLessThan(z("coolant"));
    expect(z("brake")).toBeLessThan(0);
  });

  it("marcadores ficam acima do ponto e dentro do cofre", () => {
    for (const p of scene.fillPoints) {
      const [ax, ay, az] = fillPointAnchor(p);
      expect(ay).toBeGreaterThan(p.position[1]);
      expect(Math.abs(ax)).toBeLessThan(0.87);
      expect(Math.abs(az)).toBeLessThan(0.65);
    }
  });

  it("só mostra os pontos que o banco informa, na ordem do banco", () => {
    expect(visibleFillPoints(scene, ["oil", "brake", "transmission"]).map((p) => p.fluid)).toEqual([
      "oil",
      "brake",
    ]);
  });
});
