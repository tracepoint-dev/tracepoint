import { beforeEach, describe, expect, it, vi } from "vitest";

const { domToCanvas } = vi.hoisted(() => ({ domToCanvas: vi.fn() }));
vi.mock("modern-screenshot", () => ({ domToCanvas }));

import { ROOT_ID } from "../src/constants.js";
import { tracepoint } from "../src/index.js";
import { _resetScreenshotModule } from "../src/screenshot/capture.js";
import { _resetInstance } from "../src/tracepoint.js";
import { _resetWarnings } from "../src/util/logger.js";

const tick = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  _resetInstance();
  _resetScreenshotModule();
  _resetWarnings();
  domToCanvas.mockReset();
  domToCanvas.mockResolvedValue({
    width: 80,
    height: 40,
    toDataURL: () => "data:image/png;base64,AAAA",
  });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));
  document.body.innerHTML = "";
});

describe("headless mode (ui: false)", () => {
  it("mounts no DOM and exposes the pipeline methods", () => {
    const tp = tracepoint({ webhook: "https://hook.test/x", ui: false });
    expect(document.getElementById(ROOT_ID)).toBeNull();
    expect(document.querySelector(".tp-fab")).toBeNull();
    for (const m of ["pick", "screenshot", "send"] as const) {
      expect(typeof tp[m]).toBe("function");
    }
  });

  it("open() warns and does nothing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    tracepoint({ webhook: "https://hook.test/x", ui: false }).open();
    expect(warn).toHaveBeenCalledOnce();
  });

  it("screenshot() returns the captured image", async () => {
    const tp = tracepoint({ webhook: "https://hook.test/x", ui: false });
    await expect(tp.screenshot()).resolves.toEqual({
      mimeType: "image/png",
      dataUrl: "data:image/png;base64,AAAA",
      width: 80,
      height: 40,
    });
  });

  it("send() POSTs the envelope and resolves ok", async () => {
    const tp = tracepoint({ webhook: "https://hook.test/x", ui: false });
    const res = await tp.send({ description: "broken" });
    expect(res).toEqual({ ok: true, status: 200 });
    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.report.description).toBe("broken");
  });

  it("pick() resolves with a descriptor on click and null on Esc", async () => {
    const tp = tracepoint({ webhook: "https://hook.test/x", ui: false });
    const btn = document.createElement("button");
    document.body.appendChild(btn);

    const p1 = tp.pick();
    await tick();
    btn.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
    const picked = await p1;
    expect(picked?.tag).toBe("button");

    const p2 = tp.pick();
    await tick();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await expect(p2).resolves.toBeNull();
  });
});
