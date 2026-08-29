import { describe, expect, it } from "vitest";
import { Tracepoint, useTracepoint } from "../src/index.js";

describe("@tracepoint-dev/react", () => {
  it("exports the component and hook", () => {
    expect(typeof Tracepoint).toBe("function");
    expect(typeof useTracepoint).toBe("function");
  });

  it("useTracepoint() returns null before init", () => {
    expect(useTracepoint()).toBeNull();
  });

  it("Tracepoint renders nothing in the M0 stub", () => {
    expect(Tracepoint({ webhook: "https://example.test/hook" })).toBeNull();
  });
});
