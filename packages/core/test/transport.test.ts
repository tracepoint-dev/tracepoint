import { afterEach, describe, expect, it, vi } from "vitest";
import { createConsoleTransport } from "../src/transport/console.js";
import { withRetry } from "../src/transport/retry.js";
import type { SubmitResult } from "../src/transport/types.js";
import { createWebhookTransport } from "../src/transport/webhook.js";
import { makePayload } from "./fixtures.js";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const noSleep = () => Promise.resolve();

describe("withRetry", () => {
  it("returns the first result when retryOn is false", async () => {
    const fn = vi.fn<[], Promise<SubmitResult>>().mockResolvedValue({ ok: true, status: 200 });
    const r = await withRetry(fn, { retries: 2, backoffMs: [1, 2], retryOn: () => false });
    expect(r.ok).toBe(true);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("retries up to `retries` times while retryOn is true", async () => {
    const fn = vi.fn<[], Promise<SubmitResult>>().mockResolvedValue({ ok: false, status: 500 });
    const r = await withRetry(fn, {
      retries: 2,
      backoffMs: [1, 2],
      retryOn: () => true,
      sleep: noSleep,
    });
    expect(r.status).toBe(500);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("stops early once a retry succeeds", async () => {
    const fn = vi
      .fn<[], Promise<SubmitResult>>()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    const r = await withRetry(fn, {
      retries: 2,
      backoffMs: [1, 2],
      retryOn: (x) => !x.ok,
      sleep: noSleep,
    });
    expect(r.ok).toBe(true);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("waits the configured backoff between attempts", async () => {
    const fn = vi.fn<[], Promise<SubmitResult>>().mockResolvedValue({ ok: false });
    const sleep = vi.fn(noSleep);
    await withRetry(fn, { retries: 2, backoffMs: [1000, 4000], retryOn: () => true, sleep });
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([1000, 4000]);
  });
});

describe("WebhookTransport", () => {
  const send = () => createWebhookTransport("https://hook.test/x").submit(makePayload());

  it("POSTs JSON and reports ok on 200", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const r = await send();
    expect(r).toEqual({ ok: true, status: 200 });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://hook.test/x");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string).report.description).toBe("button does nothing");
  });

  it("does not retry a 4xx", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 400 });
    vi.stubGlobal("fetch", fetchMock);

    const r = await send();
    expect(r).toMatchObject({ ok: false, status: 400 });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("retries a 5xx twice then gives up", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(globalThis, "setTimeout").mockImplementation(((cb: () => void) => {
      cb();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout);

    const r = await send();
    expect(r).toMatchObject({ ok: false, status: 500 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("retries a network error and maps it to { ok:false, error }", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(globalThis, "setTimeout").mockImplementation(((cb: () => void) => {
      cb();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout);

    const r = await send();
    expect(r.ok).toBe(false);
    expect(r.error).toContain("offline");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("ConsoleTransport", () => {
  it("logs the payload and resolves ok", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});

    const r = await createConsoleTransport().submit(makePayload());
    expect(r).toEqual({ ok: true });
    expect(log).toHaveBeenCalledOnce();
  });
});
