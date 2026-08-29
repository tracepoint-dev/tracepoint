import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { domToCanvas } = vi.hoisted(() => ({ domToCanvas: vi.fn() }));
vi.mock("modern-screenshot", () => ({ domToCanvas }));

import { ROOT_ID } from "../src/constants.js";
import { tracepoint } from "../src/index.js";
import { _resetScreenshotModule } from "../src/screenshot/capture.js";
import { _resetInstance } from "../src/tracepoint.js";

const tick = () => new Promise((r) => setTimeout(r, 0));

function shadow(): ShadowRoot {
  const host = document.getElementById(ROOT_ID);
  if (!host?.shadowRoot) throw new Error("shell not mounted");
  return host.shadowRoot;
}
const panelText = () => shadow().querySelector(".tp-panel")?.textContent ?? "";
const q = <T extends Element>(sel: string) => shadow().querySelector(sel) as T | null;

beforeEach(() => {
  _resetInstance();
  _resetScreenshotModule();
  domToCanvas.mockReset();
  domToCanvas.mockResolvedValue({
    width: 100,
    height: 50,
    toDataURL: () => "data:image/png;base64,AAAA",
  });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));
  document.body.innerHTML = "";
});

afterEach(() => {
  _resetInstance();
  vi.unstubAllGlobals();
});

describe("runtime — full flow", () => {
  it("mounts a shell with the floating button", () => {
    tracepoint({ webhook: "https://hook.test/x" });
    expect(q(".tp-fab")).not.toBeNull();
    expect(q(".tp-panel")?.getAttribute("style")).toContain("display: none");
  });

  it("omits the button when ui.button is false", () => {
    tracepoint({ webhook: "https://hook.test/x", ui: { button: false } });
    expect(q(".tp-fab")).toBeNull();
  });

  it("applies theme tokens and position to the shadow host", () => {
    tracepoint({
      webhook: "https://hook.test/x",
      ui: { position: "top-left", theme: { accent: "#7c3aed" } },
    });
    const host = document.getElementById(ROOT_ID)!;
    expect(host.style.getPropertyValue("--tp-accent")).toBe("#7c3aed");
    expect(host.style.getPropertyValue("--tp-top")).toBe("20px");
    expect(host.style.getPropertyValue("--tp-right")).toBe("auto");
  });

  it("uses a custom button label", () => {
    tracepoint({ webhook: "https://hook.test/x", ui: { button: { label: "Feedback" } } });
    expect(q(".tp-fab")?.textContent).toBe("Feedback");
  });

  it("goes open → pick → editing, showing the picked target", async () => {
    const tp = tracepoint({ webhook: "https://hook.test/x" });
    const btn = document.createElement("button");
    btn.textContent = "Buy";
    document.body.appendChild(btn);

    tp.open();
    await tick(); // picker attaches its listeners on a 0ms timer
    btn.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));

    expect(panelText()).toContain("Report an issue");
    expect(panelText()).toContain("button");
  });

  it("captures a screenshot after picking and then submits successfully", async () => {
    const tp = tracepoint({ webhook: "https://hook.test/x" });
    const btn = document.createElement("button");
    document.body.appendChild(btn);

    tp.open();
    await tick();
    btn.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
    await tick();
    await tick();

    expect(q<HTMLImageElement>(".tp-shot")).not.toBeNull();

    q<HTMLButtonElement>(".tp-btn-primary")?.click();
    await tick();

    expect(fetch).toHaveBeenCalledOnce();
    expect(panelText()).toContain("Sent");
  });

  it("shows the error view with a retry when the transport fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 400 }));
    const tp = tracepoint({ webhook: "https://hook.test/x" });
    const btn = document.createElement("button");
    document.body.appendChild(btn);

    tp.open();
    await tick();
    btn.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
    await tick();
    q<HTMLButtonElement>(".tp-btn-primary")?.click();
    await tick();

    expect(panelText()).toContain("send");
    expect(panelText()).toContain("Retry");
  });

  it("destroy() removes the shell", () => {
    const tp = tracepoint({ webhook: "https://hook.test/x" });
    tp.destroy();
    expect(document.getElementById(ROOT_ID)).toBeNull();
  });
});
