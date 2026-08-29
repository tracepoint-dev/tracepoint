/**
 * The `tracepoint()` factory and its singleton guard. The capture pipeline and
 * UI live in `runtime.ts`; this file just validates config and enforces one
 * instance per page.
 */
import { normalizeConfig } from "./config.js";
import type { NormalizedConfig } from "./internal-types.js";
import { createRuntime } from "./runtime.js";
import type { TracepointConfig, TracepointHandle } from "./types.js";
import { warnOnce } from "./util/logger.js";

interface Instance {
  handle: TracepointHandle;
  config: NormalizedConfig;
}

let current: Instance | null = null;

function configsDiffer(a: NormalizedConfig, b: NormalizedConfig): boolean {
  return (
    a.webhook !== b.webhook ||
    a.env !== b.env ||
    a.release !== b.release ||
    a.button !== b.button ||
    JSON.stringify(a.redact) !== JSON.stringify(b.redact) ||
    JSON.stringify(a.context) !== JSON.stringify(b.context)
  );
}

/**
 * Initialise Tracepoint. Idempotent: a second call returns the existing handle
 * and warns if the config differs. Call `destroy()` first to reconfigure.
 */
export function tracepoint(config: TracepointConfig): TracepointHandle {
  const normalized = normalizeConfig(config);

  if (current) {
    if (configsDiffer(current.config, normalized)) {
      warnOnce(
        "reinit",
        "tracepoint() called again with a different config — returning the existing " +
          "instance. Call destroy() first to reconfigure.",
      );
    }
    return current.handle;
  }

  const runtime = createRuntime(normalized);
  const handle: TracepointHandle = {
    open: runtime.open,
    close: runtime.close,
    setContext: runtime.setContext,
    destroy: () => {
      runtime.destroy();
      current = null;
    },
  };

  current = { handle, config: normalized };
  return handle;
}

/** Test hook — drop the singleton so each case starts clean. */
export function _resetInstance(): void {
  current?.handle.destroy();
  current = null;
}
