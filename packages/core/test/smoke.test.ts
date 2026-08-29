import { describe, expect, it } from "vitest";
import { VERSION, tracepoint } from "../src/index.js";

describe("@tracepoint-dev/core", () => {
  it("exposes a version string", () => {
    expect(typeof VERSION).toBe("string");
  });

  it("tracepoint() throws until the M1 pipeline lands", () => {
    expect(() => tracepoint({ webhook: "https://example.test/hook" })).toThrow(/M1/);
  });
});
