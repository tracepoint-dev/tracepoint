import { describe, expect, it, vi } from "vitest";
import { createReceiver } from "../src/index.js";
import { fakeStore } from "./fake-store.js";

const BASE = "http://localhost:3000/tracepoint";

function envelope(extra: Record<string, unknown> = {}) {
  return {
    tracepoint: { schemaVersion: "1.0", sdkVersion: "0.1.0" },
    id: "abc",
    createdAt: "2026-08-30T00:00:00.000Z",
    report: { description: "button does nothing", annotations: [] },
    page: { url: "https://app.test/x", route: "/x", title: "X", referrer: null },
    screenshot: {
      mimeType: "image/png",
      width: 2,
      height: 2,
      dataUrl: "data:image/png;base64,aGk=",
    },
    ...extra,
  };
}

function post(body: unknown, path = "/ingest") {
  return new Request(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("createReceiver — ingest", () => {
  it("stores the envelope and extracts the screenshot out-of-band", async () => {
    const store = fakeStore();
    const r = createReceiver({ store });

    const res = await r.handleRequest(post(envelope()));
    expect(res.status).toBe(201);
    const { id } = await res.json();

    const saved = await store.get(id);
    expect(saved?.payload.report).toMatchObject({ description: "button does nothing" });
    expect(saved?.screenshot).toEqual({ mimeType: "image/png", width: 2, height: 2 });
    // the heavy data URL is gone from the stored payload
    expect((saved?.payload.screenshot as Record<string, unknown>).dataUrl).toBeUndefined();

    const shot = await store.readScreenshot(id);
    expect(new TextDecoder().decode(shot?.bytes)).toBe("hi");
  });

  it("calls store.init() once across requests", async () => {
    const store = fakeStore();
    const r = createReceiver({ store });
    await r.handleRequest(post(envelope()));
    await r.handleRequest(post(envelope()));
    expect(store.initCalls).toBe(1);
  });

  it("400s on a non-JSON body", async () => {
    const store = fakeStore();
    const r = createReceiver({ store });
    const res = await r.handleRequest(
      new Request(`${BASE}/ingest`, { method: "POST", body: "not json" }),
    );
    expect(res.status).toBe(400);
  });

  it("404s outside the mount prefix and on unknown routes", async () => {
    const r = createReceiver({ store: fakeStore() });
    expect((await r.handleRequest(new Request("http://localhost/other"))).status).toBe(404);
    expect((await r.handleRequest(new Request(`${BASE}/nope`))).status).toBe(404);
  });

  it("runs the outbound chain after save, isolating failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const store = fakeStore();
    const seen: string[] = [];
    const boom = vi.fn(() => {
      throw new Error("nope");
    });
    const r = createReceiver({
      store,
      handlers: [boom, (report) => void seen.push(report.id)],
    });

    await r.handleRequest(post(envelope()));
    await new Promise((res) => setTimeout(res, 0));

    expect(boom).toHaveBeenCalledOnce();
    expect(seen).toHaveLength(1); // second handler still ran
  });

  it("prunes to retention.maxCount after save", async () => {
    const store = fakeStore();
    const r = createReceiver({ store, retention: { maxCount: 2 } });
    for (let i = 0; i < 4; i++) {
      await r.handleRequest(post(envelope({ createdAt: `2026-08-30T00:0${i}:00.000Z` })));
      await new Promise((res) => setTimeout(res, 0));
    }
    expect(store.rows.size).toBe(2);
  });
});
