import { beforeEach, describe, expect, it, vi } from "vitest";
import { VERSION, tracepoint } from "../src/index.js";
import { _resetInstance } from "../src/tracepoint.js";
import { _resetWarnings } from "../src/util/logger.js";

beforeEach(() => {
  _resetInstance();
  _resetWarnings();
  vi.restoreAllMocks();
});

describe("tracepoint()", () => {
  it("exposes a version string", () => {
    expect(typeof VERSION).toBe("string");
  });

  it("returns a handle with the four methods", () => {
    const tp = tracepoint({ webhook: "https://example.test/hook" });
    for (const m of ["open", "close", "setContext", "destroy"] as const) {
      expect(typeof tp[m]).toBe("function");
    }
  });

  it("is a singleton — same handle on repeat calls with the same config", () => {
    const a = tracepoint({ webhook: "https://example.test/hook" });
    const b = tracepoint({ webhook: "https://example.test/hook" });
    expect(a).toBe(b);
  });

  it("warns when re-called with a different config, still returns the first handle", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const a = tracepoint({ webhook: "https://example.test/hook" });
    const b = tracepoint({ webhook: "https://example.test/other" });
    expect(b).toBe(a);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("destroy() clears the singleton so a later call builds fresh", () => {
    const a = tracepoint({ webhook: "https://example.test/hook" });
    a.destroy();
    const b = tracepoint({ webhook: "https://example.test/hook" });
    expect(b).not.toBe(a);
  });

  it("propagates a bad-webhook throw from normalizeConfig", () => {
    expect(() => tracepoint({ webhook: "not-a-url" })).toThrow(TypeError);
  });
});
