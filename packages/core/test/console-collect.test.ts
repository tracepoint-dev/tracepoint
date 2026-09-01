import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createConsoleCollector } from "../src/collect/console.js";
import type { NormalizedConsoleCapture } from "../src/internal-types.js";

const cfg = (over: Partial<NormalizedConsoleCapture> = {}): NormalizedConsoleCapture => ({
  levels: ["log", "info", "warn", "error", "debug"],
  limit: 5,
  maxEntryBytes: 4096,
  totalBytes: 32_768,
  ...over,
});

const identity = (s: string): string => s;
let collector: { snapshot: () => unknown[]; destroy: () => void } | null = null;

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "debug").mockImplementation(() => {});
});

afterEach(() => {
  collector?.destroy();
  collector = null;
  vi.restoreAllMocks();
});

describe("createConsoleCollector", () => {
  it("buffers redacted, serialized entries per level", () => {
    collector = createConsoleCollector(cfg(), identity);
    console.log("hello", { a: 1 });
    console.warn("careful");

    const entries = collector.snapshot() as { level: string; message: string }[];
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ level: "log", message: 'hello {"a":1}' });
    expect(entries[1]).toMatchObject({ level: "warn", message: "careful" });
  });

  it("still calls through to the original console fn", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    collector = createConsoleCollector(cfg(), identity);
    console.log("passes through");
    expect(spy).toHaveBeenCalledWith("passes through");
  });

  it("collapses consecutive identical lines into one entry with a count", () => {
    collector = createConsoleCollector(cfg(), identity);
    console.log("dup");
    console.log("dup");
    console.log("dup");
    console.log("different");

    const entries = collector.snapshot() as { message: string; count?: number }[];
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ message: "dup", count: 3 });
    expect(entries[1].count).toBeUndefined();
  });

  it("applies the redactor before storing", () => {
    collector = createConsoleCollector(cfg(), (s) => s.replace(/secret-\w+/g, "«redacted»"));
    console.log("token is secret-abc123");
    const entries = collector.snapshot() as { message: string }[];
    expect(entries[0].message).toBe("token is «redacted»");
  });

  it("drops oldest beyond the limit", () => {
    collector = createConsoleCollector(cfg({ limit: 3 }), identity);
    for (let i = 0; i < 6; i++) console.log(`line ${i}`);
    const entries = collector.snapshot() as { message: string }[];
    expect(entries.map((e) => e.message)).toEqual(["line 3", "line 4", "line 5"]);
  });

  it("only patches configured levels", () => {
    collector = createConsoleCollector(cfg({ levels: ["error"] }), identity);
    console.log("ignored");
    console.error("kept");
    const entries = collector.snapshot() as { message: string }[];
    expect(entries.map((e) => e.message)).toEqual(["kept"]);
  });

  it("restores the original console fns on destroy", () => {
    const before = console.log;
    collector = createConsoleCollector(cfg(), identity);
    expect(console.log).not.toBe(before);
    collector.destroy();
    expect(console.log).toBe(before);
    collector = null;
  });

  it("leaves a foreign wrapper installed if it wrapped us after patching", () => {
    collector = createConsoleCollector(cfg(), identity);
    const ourWrapper = console.log;
    const foreign = (...args: unknown[]): void => ourWrapper(...args);
    console.log = foreign;
    collector.destroy();
    expect(console.log).toBe(foreign); // we didn't clobber the later wrapper
    collector = null;
  });
});
