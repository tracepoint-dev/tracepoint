import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMachine, reduce } from "../src/state/machine.js";
import type { Effect, Event, State } from "../src/state/machine.types.js";
import { _resetWarnings } from "../src/util/logger.js";

beforeEach(() => {
  _resetWarnings();
  vi.restoreAllMocks();
});

const el = { nodeType: 1 } as unknown as Element;

function effectTypes(state: State, event: Event): string[] {
  return reduce(state, event)?.effects.map((e) => e.type) ?? [];
}

describe("reduce — legal transitions", () => {
  it("idle + OPEN -> picking [startPicking]", () => {
    expect(reduce("idle", { type: "OPEN" })).toEqual({
      state: "picking",
      effects: [{ type: "startPicking" }],
    });
  });

  it("picking + PICK -> editing [stopPicking, buildDescriptor, startScreenshot]", () => {
    const t = reduce("picking", { type: "PICK", element: el });
    expect(t?.state).toBe("editing");
    expect(t?.effects.map((e) => e.type)).toEqual([
      "stopPicking",
      "buildDescriptor",
      "startScreenshot",
    ]);
  });

  it("picking + CANCEL -> idle [stopPicking]", () => {
    expect(effectTypes("picking", { type: "CANCEL" })).toEqual(["stopPicking"]);
  });

  it("editing + SUBMIT -> submitting [sendPayload]", () => {
    expect(reduce("editing", { type: "SUBMIT" })?.state).toBe("submitting");
    expect(effectTypes("editing", { type: "SUBMIT" })).toEqual(["sendPayload"]);
  });

  it("editing + CANCEL/CLOSE -> idle [resetDraft]", () => {
    expect(effectTypes("editing", { type: "CANCEL" })).toEqual(["resetDraft"]);
    expect(effectTypes("editing", { type: "CLOSE" })).toEqual(["resetDraft"]);
  });

  it("submitting resolves to success or error with no effects", () => {
    expect(reduce("submitting", { type: "SUBMIT_OK" })).toEqual({ state: "success", effects: [] });
    expect(reduce("submitting", { type: "SUBMIT_ERR" })).toEqual({ state: "error", effects: [] });
  });

  it("error + RETRY -> submitting [sendPayload]; error + CLOSE -> idle [resetDraft]", () => {
    expect(effectTypes("error", { type: "RETRY" })).toEqual(["sendPayload"]);
    expect(effectTypes("error", { type: "CLOSE" })).toEqual(["resetDraft"]);
  });

  it("success + CLOSE -> idle [resetDraft]", () => {
    expect(effectTypes("success", { type: "CLOSE" })).toEqual(["resetDraft"]);
  });
});

describe("reduce — illegal transitions are null", () => {
  const illegal: Array<[State, Event["type"]]> = [
    ["idle", "SUBMIT"],
    ["idle", "PICK"],
    ["picking", "SUBMIT"],
    ["picking", "OPEN"],
    ["editing", "OPEN"],
    ["submitting", "SUBMIT"],
    ["submitting", "CANCEL"],
    ["success", "OPEN"],
    ["success", "RETRY"],
    ["error", "SUBMIT"],
  ];

  for (const [state, type] of illegal) {
    it(`${state} + ${type} -> null`, () => {
      expect(reduce(state, { type } as Event)).toBeNull();
    });
  }
});

describe("createMachine", () => {
  it("runs effects in order, then notifies, and tracks state", () => {
    const calls: string[] = [];
    const run = (e: Effect) => calls.push(`effect:${e.type}`);
    const m = createMachine(run);
    m.subscribe((s) => calls.push(`state:${s}`));

    m.dispatch({ type: "OPEN" });
    m.dispatch({ type: "PICK", element: el });

    expect(m.getState()).toBe("editing");
    expect(calls).toEqual([
      "effect:startPicking",
      "state:picking",
      "effect:stopPicking",
      "effect:buildDescriptor",
      "effect:startScreenshot",
      "state:editing",
    ]);
  });

  it("ignores an illegal event with a one-time warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const m = createMachine(() => {});
    m.dispatch({ type: "SUBMIT" });
    expect(m.getState()).toBe("idle");
    expect(warn).toHaveBeenCalledOnce();
  });

  it("unsubscribe stops further notifications", () => {
    const seen: State[] = [];
    const m = createMachine(() => {});
    const off = m.subscribe((s) => seen.push(s));
    m.dispatch({ type: "OPEN" });
    off();
    m.dispatch({ type: "CANCEL" });
    expect(seen).toEqual(["picking"]);
  });
});
