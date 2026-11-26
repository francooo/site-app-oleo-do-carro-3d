import { describe, expect, it } from "vitest";

import { CURATIONS } from "@/content/curadoria";

import { emptyCuration, pointFromFigureClick, validateCuration } from "./curation";

describe("arquivos de curadoria", () => {
  it.each(CURATIONS.map((c) => [c.layout.code, c] as const))("%s é válido", (_code, c) => {
    expect(validateCuration(c)).toEqual([]);
  });

  it("códigos de layout e de motor não se repetem", () => {
    const layouts = CURATIONS.map((c) => c.layout.code);
    expect(new Set(layouts).size).toBe(layouts.length);
  });
});

describe("validateCuration", () => {
  it("uma curadoria vazia aponta o que falta, em português", () => {
    const errors = validateCuration(emptyCuration());
    expect(errors).toContain("Informe a página da figura do cofre no manual.");
    expect(errors).toContain("Marque na figura o ponto de verificação de: Óleo do motor.");
    expect(errors).toContain("Preencha a especificação de: Fluido de freio.");
  });

  it("recusa anos invertidos e item marcado duas vezes", () => {
    const c = structuredClone(CURATIONS[0]!);
    c.trims[0]!.yearTo = c.trims[0]!.yearFrom - 1;
    c.points.push({ ...c.points[0]! });
    const errors = validateCuration(c);
    expect(errors.some((e) => e.startsWith("Anos inválidos"))).toBe(true);
    expect(errors).toContain("Há um item marcado duas vezes na figura.");
  });

  it("recusa capacidade negativa ou quebrada", () => {
    const c = structuredClone(CURATIONS[0]!);
    c.fluids[0]!.volumeWithFilterMl = 37.5;
    expect(validateCuration(c).some((e) => e.includes("volumeWithFilterMl"))).toBe(true);
  });
});

describe("pointFromFigureClick", () => {
  it("topo da figura = painel (depth 1); base = para-choque (depth 0)", () => {
    expect(pointFromFigureClick("brake", 65, 10, 5)).toMatchObject({ x: 0.65, depth: 0.9 });
    expect(pointFromFigureClick("washer", 0, 100, 1)).toMatchObject({ x: 0, depth: 0 });
  });

  it("limita cliques fora da imagem e usa o nome do item", () => {
    const p = pointFromFigureClick("battery", 120, -5, 7);
    expect(p).toMatchObject({ x: 1, depth: 1, label: "Bateria", figureRef: 7, height: "mid" });
  });
});
