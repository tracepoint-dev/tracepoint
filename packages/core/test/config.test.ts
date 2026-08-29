import { beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeConfig } from "../src/config.js";
import { _resetWarnings } from "../src/util/logger.js";

beforeEach(() => {
  _resetWarnings();
  vi.restoreAllMocks();
});

describe("normalizeConfig", () => {
  it("accepts a bare https webhook and fills defaults", () => {
    const c = normalizeConfig({ webhook: "https://example.test/hook" });
    expect(c.webhook).toBe("https://example.test/hook");
    expect(c.button).toBe(true);
    expect(c.redact).toEqual([]);
    expect(c.context).toEqual({});
    expect(c.env).toBeNull();
    expect(c.release).toBeNull();
  });

  it("allows an omitted webhook (console-only mode)", () => {
    expect(normalizeConfig({}).webhook).toBeNull();
  });

  it("throws on a non-http webhook", () => {
    expect(() => normalizeConfig({ webhook: "ftp://nope" })).toThrow(TypeError);
    expect(() => normalizeConfig({ webhook: 123 })).toThrow(TypeError);
  });

  it("throws when config is not an object", () => {
    expect(() => normalizeConfig("nope")).toThrow(TypeError);
    expect(() => normalizeConfig(null)).toThrow(TypeError);
  });

  it("warns and coerces a non-boolean button", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const c = normalizeConfig({ webhook: "https://x.test", button: 0 as unknown as boolean });
    expect(c.button).toBe(false);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("warns and ignores a non-object context", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const c = normalizeConfig({ webhook: "https://x.test", context: [] as unknown as object });
    expect(c.context).toEqual({});
    expect(warn).toHaveBeenCalledOnce();
  });

  it("drops non-string redact entries with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const c = normalizeConfig({
      webhook: "https://x.test",
      redact: [".a", 5, ".b"] as unknown as string[],
    });
    expect(c.redact).toEqual([".a", ".b"]);
    expect(warn).toHaveBeenCalled();
  });

  it("warns once about unknown keys", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    normalizeConfig({ webhook: "https://x.test", nope: 1, alsoNope: 2 } as object);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toContain("nope");
  });

  it("returns a frozen object", () => {
    const c = normalizeConfig({ webhook: "https://x.test" });
    expect(Object.isFrozen(c)).toBe(true);
  });
});
