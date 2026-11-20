import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { colors } from "./tokens";

// Garante que app/globals.css (consumido pelo web) e lib/design/tokens.ts
// (consumido pelo futuro app Expo) não divergem.
describe("design tokens", () => {
  const css = readFileSync(join(__dirname, "../../app/globals.css"), "utf8");
  const root = css.slice(css.indexOf(":root"), css.indexOf("@theme"));

  for (const [name, value] of Object.entries(colors)) {
    it(`--${name} no CSS bate com tokens.ts`, () => {
      const match = root.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`));
      expect(match?.[1]?.toLowerCase()).toBe(value);
    });
  }
});
