import { describe, expect, it } from "vitest";
import { createRingBuffer } from "../src/collect/ring-buffer.js";

describe("createRingBuffer", () => {
  it("keeps only the newest `limit` entries, oldest-first eviction", () => {
    const buf = createRingBuffer<number>({ limit: 3 });
    for (const n of [1, 2, 3, 4, 5]) buf.push(n);
    expect(buf.toArray()).toEqual([3, 4, 5]);
    expect(buf.dropped).toBe(2);
  });

  it("bounds aggregate bytes when maxBytes + sizeOf are given", () => {
    const buf = createRingBuffer<string>({
      limit: 100,
      maxBytes: 10,
      sizeOf: (s) => s.length,
    });
    buf.push("aaaa"); // 4
    buf.push("bbbb"); // 8
    buf.push("cccc"); // 12 -> evict "aaaa" -> 8
    expect(buf.toArray()).toEqual(["bbbb", "cccc"]);
    expect(buf.dropped).toBe(1);
  });

  it("retains at least one entry even if it alone exceeds maxBytes", () => {
    const buf = createRingBuffer<string>({
      limit: 100,
      maxBytes: 4,
      sizeOf: (s) => s.length,
    });
    buf.push("this-one-is-way-too-big");
    expect(buf.toArray()).toEqual(["this-one-is-way-too-big"]);
  });

  it("clear() empties without resetting the lifetime dropped count", () => {
    const buf = createRingBuffer<number>({ limit: 2 });
    for (const n of [1, 2, 3]) buf.push(n);
    expect(buf.dropped).toBe(1);
    buf.clear();
    expect(buf.toArray()).toEqual([]);
    expect(buf.dropped).toBe(1);
  });

  it("toArray() returns a copy, not the live array", () => {
    const buf = createRingBuffer<number>({ limit: 5 });
    buf.push(1);
    const a = buf.toArray();
    a.push(999);
    expect(buf.toArray()).toEqual([1]);
  });
});
