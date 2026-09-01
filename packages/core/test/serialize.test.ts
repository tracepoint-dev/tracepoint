import { describe, expect, it } from "vitest";
import { serializeArg, serializeArgs } from "../src/collect/serialize.js";

describe("serializeArg", () => {
  it("renders primitives as strings", () => {
    expect(serializeArg("hi")).toBe("hi");
    expect(serializeArg(42)).toBe("42");
    expect(serializeArg(true)).toBe("true");
    expect(serializeArg(null)).toBe("null");
  });

  it("tags functions, errors, and DOM nodes instead of dumping them", () => {
    expect(serializeArg(function named() {})).toBe("[Function named]");
    expect(serializeArg(new TypeError("boom"))).toBe("[TypeError: boom]");
    const el = document.createElement("div");
    el.id = "app";
    expect(serializeArg(el)).toBe("[<div#app>]");
  });

  it("marks cycles rather than following them", () => {
    const a: Record<string, unknown> = {};
    a.self = a;
    expect(serializeArg(a)).toContain("[Circular]");
  });

  it("caps recursion depth", () => {
    const deep = { a: { b: { c: { d: { e: 1 } } } } };
    expect(serializeArg(deep)).toContain("[Object]");
  });

  it("clips very long strings", () => {
    const out = serializeArg("x".repeat(5_000));
    expect(out.length).toBeLessThan(5_000);
    expect(out).toContain("…(+");
  });

  it("caps array breadth", () => {
    const out = serializeArg(Array.from({ length: 200 }, (_, i) => i));
    expect(out).toContain("…(+150)");
  });
});

describe("serializeArgs", () => {
  it("joins multiple args with a space", () => {
    expect(serializeArgs(["a", 1, true], 1_000)).toBe("a 1 true");
  });

  it("clips the joined message to maxBytes", () => {
    const out = serializeArgs(["y".repeat(100)], 20);
    expect(out.startsWith("y".repeat(20))).toBe(true);
    expect(out).toContain("…(clipped)");
  });
});
