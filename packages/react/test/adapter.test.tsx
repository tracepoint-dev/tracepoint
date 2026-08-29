import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { domToCanvas } = vi.hoisted(() => ({ domToCanvas: vi.fn() }));
vi.mock("modern-screenshot", () => ({ domToCanvas }));

import { act, useEffect } from "react";
import { type Root, createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { Tracepoint, useTracepoint } from "../src/index.js";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  domToCanvas.mockResolvedValue({ width: 1, height: 1, toDataURL: () => "data:," });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

const HOST = "#tracepoint-root";
const probeText = () => container.querySelector('[data-testid="probe"]')?.textContent;

function Probe() {
  const tp = useTracepoint();
  return <span data-testid="probe">{tp ? "ready" : "null"}</span>;
}

describe("<Tracepoint>", () => {
  it("renders nothing and does not touch the DOM during SSR", () => {
    expect(renderToString(<Tracepoint webhook="https://x.test/hook" />)).toBe("");
    expect(document.querySelector(HOST)).toBeNull();
  });

  it("mounts core on the client and tears it down on unmount", async () => {
    await act(async () => root.render(<Tracepoint webhook="https://x.test/hook" />));
    expect(document.querySelector(HOST)).not.toBeNull();

    await act(async () => root.unmount());
    expect(document.querySelector(HOST)).toBeNull();
  });

  it("passes ui config through (no built-in button when ui.button is false)", async () => {
    await act(async () =>
      root.render(<Tracepoint webhook="https://x.test/hook" ui={{ button: false }} />),
    );
    const host = document.querySelector(HOST);
    expect(host?.shadowRoot?.querySelector(".tp-fab")).toBeNull();
  });
});

describe("useTracepoint", () => {
  it("is null before <Tracepoint> mounts, then resolves to the handle", async () => {
    await act(async () => root.render(<Probe />));
    expect(probeText()).toBe("null");

    await act(async () =>
      root.render(
        <>
          <Tracepoint webhook="https://x.test/hook" />
          <Probe />
        </>,
      ),
    );
    expect(probeText()).toBe("ready");
  });

  it("lets a consumer call handle methods (headless pick via ui:false)", async () => {
    let handleType = "";
    function Consumer() {
      const tp = useTracepoint();
      useEffect(() => {
        if (tp) handleType = typeof tp.pick;
      }, [tp]);
      return null;
    }

    await act(async () =>
      root.render(
        <>
          <Tracepoint webhook="https://x.test/hook" ui={false} />
          <Consumer />
        </>,
      ),
    );
    expect(handleType).toBe("function");
  });
});
