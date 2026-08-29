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
});
