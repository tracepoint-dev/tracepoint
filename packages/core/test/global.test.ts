import { beforeEach, describe, expect, it } from "vitest";
import { tracepoint } from "../src/index.js";
import { _resetInstance } from "../src/tracepoint.js";
import "../src/global.js";

beforeEach(() => _resetInstance());

describe("global entry", () => {
  it("assigns the factory to window.tracepoint", () => {
    expect(window.tracepoint).toBe(tracepoint);
  });

  it("does not auto-init when there is no data-webhook script", () => {
    // jsdom has no currentScript here, so nothing was initialised on import.
    const tp = window.tracepoint?.({ webhook: "https://hook.test/x" });
    expect(tp).toBeDefined();
    tp?.destroy();
  });
});
