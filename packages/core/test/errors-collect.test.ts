import { afterEach, describe, expect, it, vi } from "vitest";
import { createErrorCollector } from "../src/collect/errors.js";

const identity = (s: string): string => s;
let collector: { snapshot: () => unknown[]; destroy: () => void } | null = null;

afterEach(() => {
  collector?.destroy();
  collector = null;
});

function fireError(error: Error, message = error.message): void {
  // A plain Event with the ErrorEvent fields assigned — avoids jsdom's
  // uncaught-exception rethrow for a real ErrorEvent that isn't defaultPrevented.
  window.dispatchEvent(Object.assign(new Event("error"), { error, message }));
}

function fireRejection(reason: unknown): void {
  window.dispatchEvent(Object.assign(new Event("unhandledrejection"), { reason }));
}

describe("createErrorCollector", () => {
  it("records an uncaught error with name, message, and stack", () => {
    collector = createErrorCollector(identity);
    const err = new RangeError("out of range");
    fireError(err);

    const entries = collector.snapshot() as {
      name: string;
      message: string;
      kind: string;
      stack: string;
    }[];
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      name: "RangeError",
      message: "out of range",
      kind: "error",
    });
    expect(entries[0].stack.length).toBeGreaterThan(0);
  });

  it("records an unhandled rejection", () => {
    collector = createErrorCollector(identity);
    fireRejection(new Error("promise sad"));
    const entries = collector.snapshot() as { kind: string; message: string }[];
    expect(entries[0]).toMatchObject({ kind: "rejection", message: "promise sad" });
  });

  it("handles a non-Error rejection reason", () => {
    collector = createErrorCollector(identity);
    fireRejection("just a string");
    const entries = collector.snapshot() as { message: string; name: string }[];
    expect(entries[0].message).toBe("just a string");
    expect(entries[0].name).toBe("UnhandledRejection");
  });

  it("scrubs query strings from stack-frame URLs", () => {
    collector = createErrorCollector(identity);
    const err = new Error("bad");
    err.stack = "Error: bad\n  at foo (https://app.test/assets/main.js?token=abc123:10:5)";
    fireError(err);
    const entries = collector.snapshot() as { stack: string }[];
    expect(entries[0].stack).toContain("https://app.test/assets/main.js");
    expect(entries[0].stack).not.toContain("token=abc123");
  });

  it("runs the redactor over message and stack", () => {
    collector = createErrorCollector((s) => s.replace(/user@\S+/g, "«email»"));
    const err = new Error("failed for user@example.com");
    fireError(err);
    const entries = collector.snapshot() as { message: string }[];
    expect(entries[0].message).toBe("failed for «email»");
  });

  it("removes its window listeners on destroy", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    collector = createErrorCollector(identity);
    collector.destroy();
    expect(remove).toHaveBeenCalledWith("error", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("unhandledrejection", expect.any(Function));
    expect(collector.snapshot()).toHaveLength(0);
    collector = null;
    remove.mockRestore();
  });
});
