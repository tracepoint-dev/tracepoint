/**
 * The `tracepoint()` factory and its singleton guard. Delegates to the built-in
 * UI runtime or the headless runtime based on `ui: false` (ADR 0002).
 */
import { normalizeConfig } from "./config.js";
import { createHeadlessRuntime } from "./headless.js";
import type { NormalizedConfig } from "./internal-types.js";
import { createRuntime } from "./runtime.js";
import type { TracepointConfig, TracepointHandle } from "./types.js";
import { warnOnce } from "./util/logger.js";

interface Instance {
  handle: TracepointHandle;
  config: NormalizedConfig;
}

let current: Instance | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

/** The active handle, or `null`. For adapter authors (e.g. the React `useTracepoint` hook). */
export function getInstance(): TracepointHandle | null {
  return current?.handle ?? null;
}

/** Subscribe to instance create/destroy. Returns an unsubscribe fn. */
export function subscribeInstance(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function configsDiffer(a: NormalizedConfig, b: NormalizedConfig): boolean {
  return (
    a.webhook !== b.webhook ||
    a.env !== b.env ||
    a.release !== b.release ||
    a.headless !== b.headless ||
    JSON.stringify(a.redact) !== JSON.stringify(b.redact) ||
    JSON.stringify(a.context) !== JSON.stringify(b.context) ||
    JSON.stringify(a.ui) !== JSON.stringify(b.ui)
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

  const runtime = normalized.headless
    ? createHeadlessRuntime(normalized)
    : createRuntime(normalized);

  const handle: TracepointHandle = {
    ...runtime,
    destroy: () => {
      runtime.destroy();
      current = null;
      notify();
    },
  };

  current = { handle, config: normalized };
  notify();
  return handle;
}

/** Test hook — drop the singleton so each case starts clean. */
export function _resetInstance(): void {
  current?.handle.destroy();
  current = null;
  notify();
}
