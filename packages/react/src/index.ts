/**
 * @tracepoint-dev/react — React adapter.
 *
 * A thin wrapper over @tracepoint-dev/core: it owns lifecycle (mount/unmount),
 * SSR safety (no work during server render), and prop reactivity — nothing else.
 * No capture, screenshot, transport, redaction, or payload logic lives here.
 *
 * M0 scaffold: `<Tracepoint>` renders nothing and `useTracepoint()` returns null.
 * Real behaviour lands in milestone M2.
 */
import type { TracepointConfig, TracepointHandle } from "@tracepoint-dev/core";

export type { TracepointConfig, TracepointHandle } from "@tracepoint-dev/core";

/** Props for `<Tracepoint>` — every `TracepointConfig` field, passed declaratively. */
export type TracepointProps = TracepointConfig;

let warned = false;

/**
 * Drop-in component. Place it once near the root. In M2 it will call `tracepoint()`
 * in a browser-only effect, keep context in sync with props, and destroy on unmount.
 * Renders nothing.
 */
export function Tracepoint(_props: TracepointProps): null {
  if (typeof window !== "undefined" && !warned) {
    warned = true;
    console.warn("[tracepoint] <Tracepoint> is an M0 stub — no capture yet.");
  }
  return null;
}

/** Access the singleton handle from anywhere in the tree. `null` before init. */
export function useTracepoint(): TracepointHandle | null {
  return null;
}
