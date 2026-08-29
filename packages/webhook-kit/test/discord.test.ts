import { afterEach, describe, expect, it, vi } from "vitest";
import { discord } from "../src/connectors/index.js";
import type { HandlerCtx, StoredReport } from "../src/types.js";

afterEach(() => vi.unstubAllGlobals());

function report(overrides: Partial<StoredReport> = {}): StoredReport {
  return {
    id: "r1",
    createdAt: "2026-08-30T00:00:00.000Z",
    receivedAt: "2026-08-30T00:00:01.000Z",
    payload: {
      report: { description: "checkout is broken" },
      page: { url: "https://app.test/checkout", route: "/checkout" },
      target: { tag: "button", primarySelector: "#pay" },
      client: { userAgent: "Chrome" },
    },
    screenshot: { mimeType: "image/png", width: 4, height: 2 },
    ...overrides,
  };
}

const ctx = (bytes?: Uint8Array): HandlerCtx => ({
  logger: { info: () => {}, error: () => {} },
  readScreenshot: async () => (bytes ? { mimeType: "image/png", bytes } : null),
});

describe("discord connector", () => {
  it("posts an embed + screenshot attachment as multipart", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    await discord("https://discord.test/hook")(report(), ctx(new TextEncoder().encode("PNG")));

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://discord.test/hook");
    const form = init.body as FormData;
    const payload = JSON.parse(form.get("payload_json") as string);
    expect(payload.embeds[0].description).toBe("checkout is broken");
    expect(payload.embeds[0].fields).toContainEqual({
      name: "Route",
      value: "/checkout",
      inline: true,
    });
    expect(payload.embeds[0].image).toEqual({ url: "attachment://screenshot.png" });
    expect(form.get("files[0]")).toBeInstanceOf(Blob);
  });

  it("omits the attachment when there is no screenshot", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    await discord("https://discord.test/hook")(report({ screenshot: null }), ctx());

    const form = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as FormData;
    expect(form.get("files[0]")).toBeNull();
    expect(JSON.parse(form.get("payload_json") as string).embeds[0].image).toBeUndefined();
  });

  it("is a no-op when the webhook url is undefined", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await discord(undefined)(report(), ctx());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws on a non-ok response so the receiver logs it", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    await expect(discord("https://discord.test/hook")(report(), ctx())).rejects.toThrow(/429/);
  });
});
