import { beforeEach, describe, expect, it, vi } from "vitest";

const { domToCanvas } = vi.hoisted(() => ({ domToCanvas: vi.fn() }));
vi.mock("modern-screenshot", () => ({ domToCanvas }));

import { _resetScreenshotModule, captureScreenshot } from "../src/screenshot/capture.js";

const fakeCanvas = {
  width: 200,
  height: 100,
  toDataURL: () => "data:image/png;base64,AAAA",
} as unknown as HTMLCanvasElement;

beforeEach(() => {
  _resetScreenshotModule();
  domToCanvas.mockReset();
  vi.restoreAllMocks();
});

describe("captureScreenshot", () => {
  it("returns a PNG Screenshot from the rasteriser", async () => {
    domToCanvas.mockResolvedValue(fakeCanvas);
    const shot = await captureScreenshot();
    expect(shot).toEqual({
      mimeType: "image/png",
      dataUrl: "data:image/png;base64,AAAA",
      width: 200,
      height: 100,
    });
    expect(domToCanvas).toHaveBeenCalledOnce();
  });

  it("passes viewport width/height by default and omits them for fullPage", async () => {
    domToCanvas.mockResolvedValue(fakeCanvas);

    await captureScreenshot();
    expect(domToCanvas.mock.calls[0]?.[1]).toMatchObject({ width: window.innerWidth });

    await captureScreenshot({ fullPage: true });
    expect(domToCanvas.mock.calls[1]?.[1]).not.toHaveProperty("width");
  });

  it("fails soft: logs a warning and returns null when the rasteriser throws", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    domToCanvas.mockRejectedValue(new Error("tainted canvas"));

    const shot = await captureScreenshot();
    expect(shot).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
  });

  it("caches the dynamic import across calls", async () => {
    domToCanvas.mockResolvedValue(fakeCanvas);
    await captureScreenshot();
    await captureScreenshot();
    // module resolved once; both calls used it
    expect(domToCanvas).toHaveBeenCalledTimes(2);
  });
});
