import type { Payload } from "../src/internal-types.js";

/** A minimal, well-formed payload for tests that just need *a* payload. */
export function makePayload(overrides: Partial<Payload> = {}): Payload {
  return {
    tracepoint: { schemaVersion: "1.0", sdkVersion: "0.0.0" },
    id: "test-id",
    createdAt: "2026-08-29T00:00:00.000Z",
    report: { description: "button does nothing", annotations: [] },
    target: null,
    page: { url: "https://example.test/app", route: null, title: "App", referrer: null },
    screenshot: null,
    client: {
      userAgent: "test",
      viewport: { width: 1280, height: 800, dpr: 1 },
      screen: { width: 1920, height: 1080 },
      language: "en-US",
      timezone: "UTC",
    },
    context: {},
    ...overrides,
  };
}
