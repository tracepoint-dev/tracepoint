import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createNetworkCollector } from "../src/collect/network.js";
import { SENSITIVE_URL_PARAMS } from "../src/constants.js";
import type { NetworkEntry, NormalizedNetworkCapture } from "../src/internal-types.js";

const cfg = (over: Partial<NormalizedNetworkCapture> = {}): NormalizedNetworkCapture => ({
  limit: 5,
  denyUrls: [],
  ...over,
});
const baseOpts = { selfUrl: null, urlParams: [...SENSITIVE_URL_PARAMS] };

function fakeResponse(status: number, contentLength?: string): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get: (k: string) => (k.toLowerCase() === "content-length" ? (contentLength ?? null) : null),
    },
  } as unknown as Response;
}

// ---- fake XHR so tests never touch a real socket -------------------------
class FakeXHR {
  status = 0;
  private listeners: Record<string, Array<() => void>> = {};
  open(_method: string, _url: string): void {}
  send(_body?: unknown): void {}
  addEventListener(type: string, cb: () => void): void {
    this.listeners[type] ??= [];
    this.listeners[type].push(cb);
  }
  getResponseHeader(_name: string): string | null {
    return null;
  }
  fireLoadend(status: number): void {
    this.status = status;
    for (const cb of this.listeners.loadend ?? []) cb();
  }
}

let realFetch: typeof window.fetch;
let realXHR: typeof XMLHttpRequest;
let collector: { snapshot: () => NetworkEntry[]; destroy: () => void } | null = null;

beforeEach(() => {
  realFetch = window.fetch;
  realXHR = globalThis.XMLHttpRequest;
});
afterEach(() => {
  collector?.destroy();
  collector = null;
  window.fetch = realFetch;
  globalThis.XMLHttpRequest = realXHR;
  vi.restoreAllMocks();
});

describe("createNetworkCollector — fetch", () => {
  it("records method, cleaned url, status, and byte counts", async () => {
    window.fetch = vi.fn().mockResolvedValue(fakeResponse(200, "512"));
    collector = createNetworkCollector(cfg(), baseOpts);

    await window.fetch("https://api.test/items?token=secret&page=1", {
      method: "POST",
      body: "hello",
    });

    const [entry] = collector.snapshot();
    expect(entry).toMatchObject({
      method: "POST",
      status: 200,
      reqBytes: 5,
      resBytes: 512,
    });
    expect(entry.url).toContain("token=REDACTED");
    expect(entry.url).toContain("page=1");
    expect(entry.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("marks a rejected fetch as failed with a null status and rethrows", async () => {
    window.fetch = vi.fn().mockRejectedValue(new Error("offline"));
    collector = createNetworkCollector(cfg(), baseOpts);

    await expect(window.fetch("https://api.test/x")).rejects.toThrow("offline");
    const [entry] = collector.snapshot();
    expect(entry).toMatchObject({ status: null, failed: true });
  });

  it("excludes the SDK's own webhook URL", async () => {
    window.fetch = vi.fn().mockResolvedValue(fakeResponse(200));
    collector = createNetworkCollector(cfg(), {
      ...baseOpts,
      selfUrl: "https://hooks.test/ingest",
    });

    await window.fetch("https://hooks.test/ingest", { method: "POST" });
    await window.fetch("https://api.test/other");

    const urls = collector.snapshot().map((e) => e.url);
    expect(urls.some((u) => u.includes("hooks.test"))).toBe(false);
    expect(urls.some((u) => u.includes("api.test/other"))).toBe(true);
  });

  it("honours denyUrls (string + RegExp)", async () => {
    window.fetch = vi.fn().mockResolvedValue(fakeResponse(200));
    collector = createNetworkCollector(cfg({ denyUrls: ["/analytics", /segment\.io/] }), baseOpts);

    await window.fetch("https://api.test/analytics/collect");
    await window.fetch("https://cdn.segment.io/v1/t");
    await window.fetch("https://api.test/keep");

    expect(collector.snapshot().map((e) => e.url)).toEqual([
      expect.stringContaining("api.test/keep"),
    ]);
  });

  it("drops oldest beyond the limit", async () => {
    window.fetch = vi.fn().mockResolvedValue(fakeResponse(200));
    collector = createNetworkCollector(cfg({ limit: 2 }), baseOpts);
    for (let i = 0; i < 4; i++) await window.fetch(`https://api.test/${i}`);
    expect(collector.snapshot().map((e) => e.url)).toEqual([
      "https://api.test/2",
      "https://api.test/3",
    ]);
  });

  it("restores window.fetch on destroy", () => {
    const mock = vi.fn();
    window.fetch = mock as unknown as typeof window.fetch;
    collector = createNetworkCollector(cfg(), baseOpts);
    expect(window.fetch).not.toBe(mock);
    collector.destroy();
    expect(window.fetch).toBe(mock);
    collector = null;
  });
});

describe("createNetworkCollector — XMLHttpRequest", () => {
  it("records an XHR round-trip on loadend", () => {
    globalThis.XMLHttpRequest = FakeXHR as unknown as typeof XMLHttpRequest;
    collector = createNetworkCollector(cfg(), baseOpts);

    const xhr = new XMLHttpRequest() as unknown as FakeXHR;
    xhr.open("GET", "https://api.test/thing?secret=x");
    xhr.send();
    xhr.fireLoadend(204);

    const [entry] = collector.snapshot();
    expect(entry).toMatchObject({ method: "GET", status: 204 });
    expect(entry.url).toContain("secret=REDACTED");
  });

  it("marks status 0 as a failed request", () => {
    globalThis.XMLHttpRequest = FakeXHR as unknown as typeof XMLHttpRequest;
    collector = createNetworkCollector(cfg(), baseOpts);

    const xhr = new XMLHttpRequest() as unknown as FakeXHR;
    xhr.open("GET", "https://api.test/down");
    xhr.send();
    xhr.fireLoadend(0);

    expect(collector.snapshot()[0]).toMatchObject({ status: null, failed: true });
  });

  it("restores XHR prototype methods on destroy", () => {
    globalThis.XMLHttpRequest = FakeXHR as unknown as typeof XMLHttpRequest;
    const open = FakeXHR.prototype.open;
    collector = createNetworkCollector(cfg(), baseOpts);
    expect(FakeXHR.prototype.open).not.toBe(open);
    collector.destroy();
    expect(FakeXHR.prototype.open).toBe(open);
    collector = null;
  });
});
