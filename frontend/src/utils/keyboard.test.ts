import { describe, expect, it } from "vitest";
import { keyboardInset } from "./keyboard";

describe("keyboardInset", () => {
  it("reports the keyboard height", () => {
    expect(keyboardInset(844, 508, 0)).toBe(336);
    expect(keyboardInset(844, 508, 40)).toBe(296); // page scrolled while the keyboard is open
  });
  it("ignores toolbar-sized differences and negative values", () => {
    expect(keyboardInset(844, 800, 0)).toBe(0);
    expect(keyboardInset(844, 900, 0)).toBe(0);
  });
});
