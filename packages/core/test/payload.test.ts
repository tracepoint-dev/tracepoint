import { describe, expect, it } from "vitest";
import type { Draft } from "../src/internal-types.js";
import { assemblePayload } from "../src/payload/assemble.js";
import { readClientEnv } from "../src/payload/client-env.js";

function emptyDraft(): Draft {
  return { description: "", target: null, screenshot: null, annotations: [] };
}

describe("assemblePayload", () => {
  it("produces the frozen envelope shape with required fields", () => {
    const p = assemblePayload({ ...emptyDraft(), description: "broken" }, {});
    expect(p.tracepoint).toEqual({ schemaVersion: "2.0", sdkVersion: "0.0.0" });
    expect(typeof p.id).toBe("string");
    expect(p.id.length).toBeGreaterThan(0);
    expect(new Date(p.createdAt).toISOString()).toBe(p.createdAt);
    expect(p.report.description).toBe("broken");
    expect(p.page.url).toContain("http");
    expect(Object.keys(p)).toEqual([
      "tracepoint",
      "id",
      "createdAt",
      "report",
      "target",
      "page",
      "screenshot",
      "client",
      "context",
      "console",
      "errors",
      "network",
      "capture",
    ]);
  });

  it("defaults the Phase 2 fields to empty when no collector snapshot is given", () => {
    const p = assemblePayload(emptyDraft(), {});
    expect(p.console).toEqual([]);
    expect(p.errors).toEqual([]);
    expect(p.network).toEqual([]);
    expect(p.capture).toEqual({ console: false, network: false, truncated: {} });
  });

  it("carries a collector snapshot through", () => {
    const snapshot = {
      console: [{ level: "warn" as const, message: "hmm", ts: 12 }],
      errors: [],
      network: [
        {
          method: "GET",
          url: "https://api.test/x",
          status: 500,
          durationMs: 4,
          ts: 20,
          failed: true,
        },
      ],
      enabled: { console: true, network: true },
    };
    const p = assemblePayload(emptyDraft(), {}, snapshot);
    expect(p.console).toEqual(snapshot.console);
    expect(p.console).not.toBe(snapshot.console);
    expect(p.network[0]?.status).toBe(500);
    expect(p.capture).toEqual({ console: true, network: true, truncated: {} });
  });

  it("copies annotations and context rather than sharing references", () => {
    const draft: Draft = {
      ...emptyDraft(),
      annotations: [{ type: "selection-rect", rect: { x: 0, y: 0, width: 1, height: 1 } }],
    };
    const context = { userId: "u_1" };
    const p = assemblePayload(draft, context);

    expect(p.report.annotations).toEqual(draft.annotations);
    expect(p.report.annotations).not.toBe(draft.annotations);
    expect(p.context).toEqual(context);
    expect(p.context).not.toBe(context);
  });

  it("passes target and screenshot through from the draft", () => {
    const screenshot = { mimeType: "image/png", dataUrl: "data:,", width: 2, height: 2 };
    const p = assemblePayload({ ...emptyDraft(), screenshot }, {});
    expect(p.screenshot).toBe(screenshot);
    expect(p.target).toBeNull();
  });

  it("mints a unique id per call", () => {
    const a = assemblePayload(emptyDraft(), {});
    const b = assemblePayload(emptyDraft(), {});
    expect(a.id).not.toBe(b.id);
  });

  it("scrubs sensitive query params from page.url", () => {
    const original = location.href;
    history.replaceState(null, "", "/app?token=sekret&page=2");
    try {
      const p = assemblePayload(emptyDraft(), {}, undefined, ["token"]);
      expect(p.page.url).toContain("token=REDACTED");
      expect(p.page.url).toContain("page=2");
      expect(p.page.url).not.toContain("sekret");
    } finally {
      history.replaceState(null, "", original);
    }
  });
});

describe("readClientEnv", () => {
  it("reads strings and numbers from the environment", () => {
    const env = readClientEnv();
    expect(typeof env.userAgent).toBe("string");
    expect(typeof env.language).toBe("string");
    expect(typeof env.timezone).toBe("string");
    expect(env.viewport.width).toBeGreaterThan(0);
    expect(env.viewport.dpr).toBeGreaterThan(0);
    // jsdom reports screen dimensions as 0; a real browser gives real values.
    expect(typeof env.screen.width).toBe("number");
  });
});
