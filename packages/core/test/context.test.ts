import { describe, expect, it } from "vitest";
import { normalizeConfig } from "../src/config.js";
import { prepareContext } from "../src/payload/context.js";
import { resolveContext } from "../src/pipeline.js";

describe("prepareContext", () => {
  it("returns a shallow copy when nothing needs doing", () => {
    const raw = { a: 1, b: "x" };
    const out = prepareContext(raw);
    expect(out).toEqual(raw);
    expect(out).not.toBe(raw);
  });

  it("runs the redact.text hook over nested string values", () => {
    const out = prepareContext(
      { user: { email: "a@b.com" }, tags: ["free", "a@b.com"] },
      { redactText: (s) => s.replace(/\S+@\S+/g, "«email»") },
    );
    expect(out).toEqual({ user: { email: "«email»" }, tags: ["free", "«email»"] });
  });

  it("caps recursion depth without throwing on a cyclic object", () => {
    const cyclic: Record<string, unknown> = { name: "root" };
    cyclic.self = cyclic;
    expect(() => prepareContext(cyclic, { redactText: (s) => s })).not.toThrow();
  });

  it("trims keys over the byte cap and notes how many were dropped", () => {
    const out = prepareContext(
      { keep: "small", big: "z".repeat(500), also: "y".repeat(500) },
      { maxBytes: 200 },
    );
    expect(out.keep).toBe("small");
    expect(out.big).toBeUndefined();
    expect(out.__tracepointNote).toContain("omitted");
  });
});

describe("resolveContext", () => {
  const cfg = (over: Parameters<typeof normalizeConfig>[0]) =>
    normalizeConfig({ webhook: "https://x.test", ...(over as object) });

  it("merges a function-form context, with live values winning on a clash", () => {
    const config = cfg({ context: () => ({ route: "/checkout", userId: "from-fn" }) });
    const out = resolveContext(config, { userId: "from-setContext" });
    expect(out).toEqual({ route: "/checkout", userId: "from-setContext" });
  });

  it("ignores a throwing context function", () => {
    const config = cfg({
      context: () => {
        throw new Error("nope");
      },
    });
    expect(resolveContext(config, { a: 1 })).toEqual({ a: 1 });
  });

  it("applies redact.text from config over the merged context", () => {
    const config = cfg({
      context: () => ({ note: "call me at 555 secret" }),
      redact: { text: (s: string) => s.replace(/secret/g, "«x»") },
    });
    expect(resolveContext(config, {}).note).toBe("call me at 555 «x»");
  });
});
