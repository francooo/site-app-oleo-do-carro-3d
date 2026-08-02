import { describe, expect, it } from "vitest";

import { isValidPlateFormat, normalizePlate } from "./plate";

describe("normalizePlate", () => {
  it("uppercases and strips separators", () => {
    expect(normalizePlate("abc-1234")).toBe("ABC1234");
    expect(normalizePlate(" abc 1d23 ")).toBe("ABC1D23");
  });
});

describe("isValidPlateFormat", () => {
  it("accepts the old format", () => {
    expect(isValidPlateFormat("ABC1234")).toBe(true);
    expect(isValidPlateFormat("abc-1234")).toBe(true);
  });

  it("accepts the Mercosul format", () => {
    expect(isValidPlateFormat("ABC1D23")).toBe(true);
  });

  it("rejects malformed plates", () => {
    expect(isValidPlateFormat("ABCD123")).toBe(false);
    expect(isValidPlateFormat("AB1234")).toBe(false);
    expect(isValidPlateFormat("")).toBe(false);
  });
});
