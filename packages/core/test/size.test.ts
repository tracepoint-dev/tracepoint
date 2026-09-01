import { describe, expect, it } from "vitest";
import type { ConsoleEntry, NetworkEntry } from "../src/internal-types.js";
import { enforceSize } from "../src/payload/size.js";
import { makePayload } from "./fixtures.js";

function bigConsole(count: number, bytesEach: number): ConsoleEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    level: "log" as const,
    message: `${i}:${"x".repeat(bytesEach)}`,
    ts: i,
  }));
}

function bigNetwork(count: number, bytesEach: number): NetworkEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    method: "GET",
    url: `https://api.test/${"y".repeat(bytesEach)}?i=${i}`,
    status: 200,
    durationMs: 1,
    ts: i,
  }));
}

describe("enforceSize", () => {
  it("leaves a small payload untouched", () => {
    const p = makePayload({ console: bigConsole(3, 10) });
    const { payload, oversize } = enforceSize(p);
    expect(oversize).toBe(false);
    expect(payload.console).toHaveLength(3);
    expect(payload.capture.truncated).toEqual({});
  });

  it("trims console oldest-first over the soft ceiling and records the count", () => {
    // ~40 KB * 20 = ~800 KB of console, over the 512 KB soft ceiling
    const p = makePayload({ console: bigConsole(20, 40_000) });
    const { payload, oversize } = enforceSize(p);
    expect(oversize).toBe(false);
    expect(payload.console.length).toBeLessThan(20);
    expect(payload.capture.truncated.console).toBeGreaterThan(0);
    // the entries that survived are the newest ones
    const firstKept = Number(payload.console[0]?.message.split(":")[0]);
    expect(firstKept).toBeGreaterThan(0);
  });

  it("trims network only after console is exhausted", () => {
    const p = makePayload({
      console: bigConsole(5, 40_000), // ~200 KB
      network: bigNetwork(20, 40_000), // ~800 KB
    });
    const { payload } = enforceSize(p);
    expect(payload.console).toHaveLength(0);
    expect(payload.capture.truncated.console).toBe(5);
    expect(payload.network.length).toBeLessThan(20);
    expect(payload.capture.truncated.network).toBeGreaterThan(0);
  });

  it("flags oversize when trimming everything still can't get under the hard ceiling", () => {
    const huge = "z".repeat(3_000_000);
    const p = makePayload({ context: { blob: huge } });
    const { oversize } = enforceSize(p);
    expect(oversize).toBe(true);
  });

  it("excludes the screenshot data URL from the measurement", () => {
    const p = makePayload({
      screenshot: {
        mimeType: "image/png",
        dataUrl: `data:image/png;base64,${"A".repeat(2_000_000)}`,
        width: 10,
        height: 10,
      },
      console: bigConsole(3, 10),
    });
    const { oversize, payload } = enforceSize(p);
    expect(oversize).toBe(false);
    expect(payload.console).toHaveLength(3);
  });
});
