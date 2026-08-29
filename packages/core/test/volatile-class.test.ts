import { describe, expect, it } from "vitest";
import { isStableClass, looksAuthoredId } from "../src/capture/volatile-class.js";

describe("isStableClass", () => {
  it("accepts hand-written / design-system class names", () => {
    for (const n of ["btn", "card", "primary-button", "MuiButton-root", "block__element"]) {
      expect(isStableClass(n), n).toBe(true);
    }
  });

  it("rejects hashed / generated class names", () => {
    for (const n of [
      "css-1x2y3z",
      "sc-bdfBwQ",
      "emotion-7",
      "jsx-1234567890",
      "App_logo__SUeAP",
      "_root_1a2b3",
      "a1b2c3d4e5",
      "box-9f8e7d6c",
    ]) {
      expect(isStableClass(n), n).toBe(false);
    }
  });
});

describe("looksAuthoredId", () => {
  it("accepts hand-written ids", () => {
    for (const id of ["main-nav", "submit", "email", "app-root"]) {
      expect(looksAuthoredId(id), id).toBe(true);
    }
  });

  it("rejects framework-generated ids", () => {
    for (const id of [
      "radix-:r1:",
      "headlessui-menu-button-1",
      "mui-1234",
      "x1a2b3c",
      "field-482",
    ]) {
      expect(looksAuthoredId(id), id).toBe(false);
    }
  });
});
