import { describe, expect, it } from "vitest";
import { drawSelectionRect } from "../src/annotate/selection-rect.js";
import type { Screenshot } from "../src/internal-types.js";

const shot: Screenshot = {
  mimeType: "image/png",
  dataUrl: "data:image/png;base64,AAAA",
  width: 200,
  height: 100,
};

describe("drawSelectionRect", () => {
  it("returns the original screenshot unchanged when 2d canvas is unavailable (jsdom)", async () => {
    const out = await drawSelectionRect(shot, { x: 10, y: 10, width: 40, height: 20 });
    expect(out).toBe(shot);
  });
});
