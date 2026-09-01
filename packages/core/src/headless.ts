/**
 * Headless runtime (`ui: false`) — no button, no panel. The handle's pipeline
 * methods are the whole API; `open` / `close` warn and no-op (ADR 0002).
 */
import { pickOnce } from "./capture/pick-once.js";
import { createCollectors } from "./collect/index.js";
import type { NormalizedConfig } from "./internal-types.js";
import { pickTransport, resolveContext, runScreenshot, runSend } from "./pipeline.js";
import type { Transport } from "./transport/types.js";
import type { TracepointHandle } from "./types.js";
import { warnOnce } from "./util/logger.js";

function bareHighlight() {
  const el = document.createElement("div");
  el.style.cssText =
    "position:fixed;z-index:2147483000;pointer-events:none;display:none;" +
    "border:2px solid #e1522a;background:rgba(225,82,42,.08)";
  document.documentElement.append(el);
  return {
    el,
    show(rect: DOMRect) {
      Object.assign(el.style, {
        display: "block",
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      });
    },
    hide() {
      el.style.display = "none";
    },
  };
}

export function createHeadlessRuntime(config: NormalizedConfig): TracepointHandle {
  const context: Record<string, unknown> = { ...config.context };
  const transport: Transport = pickTransport(config.webhook);
  const collectors = createCollectors(config);

  return {
    open: () => warnOnce("headless:open", "open() has no effect in headless mode (ui: false)"),
    close: () => warnOnce("headless:close", "close() has no effect in headless mode (ui: false)"),
    setContext: (patch) => {
      Object.assign(context, patch);
    },
    destroy: () => {
      collectors.destroy();
    },
    pick: () => {
      const hl = bareHighlight();
      return pickOnce(hl.el, hl).finally(() => hl.el.remove());
    },
    screenshot: (opts) => runScreenshot(config.redact, opts),
    send: (input) =>
      runSend(
        input,
        resolveContext(config, context),
        transport,
        collectors.snapshot(),
        config.redactUrlParams,
      ),
  };
}
