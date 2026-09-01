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
    expect(c.redact).toEqual([]);
    expect(c.context).toEqual({});
    expect(c.env).toBeNull();
    expect(c.release).toBeNull();
    expect(c.headless).toBe(false);
    expect(c.ui.position).toBe("bottom-right");
    expect(c.ui.button?.label).toBe("Report an issue");
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

  it("maps `ui: false` to headless and keeps default ui values", () => {
    const c = normalizeConfig({ webhook: "https://x.test", ui: false });
    expect(c.headless).toBe(true);
    expect(c.ui.button?.label).toBe("Report an issue");
  });

  it("resolves a partial `ui` object", () => {
    const c = normalizeConfig({
      webhook: "https://x.test",
      ui: {
        position: "top-left",
        theme: { accent: "#7c3aed", colorScheme: "dark" },
        button: { label: "Feedback", variant: "icon" },
        labels: { submit: "Send it" },
        icons: { close: "<svg/>" },
        trigger: "#help",
      },
    });
    expect(c.headless).toBe(false);
    expect(c.ui.position).toBe("top-left");
    expect(c.ui.theme.accent).toBe("#7c3aed");
    expect(c.ui.theme.colorScheme).toBe("dark");
    expect(c.ui.button).toEqual({ icon: null, label: "Feedback", variant: "icon" });
    expect(c.ui.labels.submit).toBe("Send it");
    expect(c.ui.labels.cancel).toBe("Cancel"); // untouched default
    expect(c.ui.icons.close).toBe("<svg/>");
    expect(c.ui.trigger).toBe("#help");
  });

  it("`ui: { button: false }` means no button", () => {
    expect(
      normalizeConfig({ webhook: "https://x.test", ui: { button: false } }).ui.button,
    ).toBeNull();
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

  // ---------------------------------------------------------------- Phase 2 keys

  it("leaves console + network capture off by default", () => {
    const c = normalizeConfig({ webhook: "https://x.test" });
    expect(c.console).toBeNull();
    expect(c.network).toBeNull();
  });

  it("`console: true` fills capture defaults", () => {
    const c = normalizeConfig({ webhook: "https://x.test", console: true });
    expect(c.console).toEqual({
      levels: ["log", "info", "warn", "error", "debug"],
      limit: 50,
      maxEntryBytes: 4096,
      totalBytes: 32768,
    });
  });

  it("`console` object overrides only what it sets", () => {
    const c = normalizeConfig({
      webhook: "https://x.test",
      console: { levels: ["error", "warn", "bogus"] as never, limit: 10 },
    });
    expect(c.console?.levels).toEqual(["error", "warn"]);
    expect(c.console?.limit).toBe(10);
    expect(c.console?.maxEntryBytes).toBe(4096);
  });

  it("`network` object keeps string + RegExp denyUrls, drops junk", () => {
    const c = normalizeConfig({
      webhook: "https://x.test",
      network: { limit: 5, denyUrls: ["/analytics", /segment\.io/, 42 as never] },
    });
    expect(c.network?.limit).toBe(5);
    expect(c.network?.denyUrls).toHaveLength(2);
  });

  it("warns and disables capture on a non-object console value", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const c = normalizeConfig({ webhook: "https://x.test", console: 5 as never });
    expect(c.console).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it("accepts the object `redact` form and merges urlParams over the built-ins", () => {
    const fn = (s: string) => s.replace(/x/g, "*");
    const c = normalizeConfig({
      webhook: "https://x.test",
      redact: { selectors: [".secret"], text: fn, urlParams: ["Tenant"], pii: true },
    });
    expect(c.redact).toEqual([".secret"]);
    expect(c.redactText).toBe(fn);
    expect(c.redactPii).toBe(true);
    expect(c.redactUrlParams).toContain("token"); // built-in kept
    expect(c.redactUrlParams).toContain("tenant"); // user extra, lower-cased
  });

  it("bare-array `redact` still works and seeds the default urlParams", () => {
    const c = normalizeConfig({ webhook: "https://x.test", redact: [".a"] });
    expect(c.redact).toEqual([".a"]);
    expect(c.redactText).toBeNull();
    expect(c.redactPii).toBe(false);
    expect(c.redactUrlParams).toContain("access_token");
  });

  it("keeps a function `context` as `contextFn`, not `context`", () => {
    const fn = () => ({ userId: "u_9" });
    const c = normalizeConfig({ webhook: "https://x.test", context: fn });
    expect(c.context).toEqual({});
    expect(c.contextFn).toBe(fn);
  });
});
