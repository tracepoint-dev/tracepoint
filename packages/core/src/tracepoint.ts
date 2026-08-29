/**
 * The `tracepoint()` factory and its singleton guard.
 *
 * M1 in progress: config validation and the singleton are wired here now; the
 * state machine, capture pipeline, and UI are attached in later steps (ADR 0001).
 */
import { normalizeConfig } from "./config.js";
import type { NormalizedConfig } from "./internal-types.js";
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

function createHandle(config: NormalizedConfig): TracepointHandle {
  // Mutable context the report will carry; seeded from config, updated via setContext().
  const context: Record<string, unknown> = { ...config.context };

  return {
    open() {
      warnOnce("handle:open", "open() has no effect yet — the reporter UI lands later in M1.");
    },
    close() {
      warnOnce("handle:close", "close() has no effect yet — the reporter UI lands later in M1.");
    },
    setContext(patch) {
      Object.assign(context, patch);
    },
    destroy() {
      current = null;
    },
  };
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

  current = { handle: createHandle(normalized), config: normalized };
  return current.handle;
}

/** Test hook — drop the singleton so each case starts clean. */
export function _resetInstance(): void {
  current = null;
}
