/**
 * @tracepoint-dev/core — framework-agnostic entry point.
 *
 * M0 scaffold: exports the frozen type contract and a `tracepoint()` stub.
 * The capture pipeline (button, picker, screenshot, payload, transport) lands in M1.
 */
import type { TracepointConfig, TracepointHandle } from "./types.js";

export type { TracepointConfig, TracepointHandle } from "./types.js";

/** Package version. Kept in sync with package.json at release time. */
export const VERSION = "0.0.0";

const NOT_IMPLEMENTED = "tracepoint(): capture pipeline lands in Phase 1 milestone M1";

/**
 * Initialise Tracepoint.
 *
 * Idempotent by design: a second call returns the same handle and warns if the
 * config differs. Nothing is sent on init — only when a user submits a report.
 *
 * @throws until M1 is implemented.
 */
export function tracepoint(_config: TracepointConfig): TracepointHandle {
  throw new Error(NOT_IMPLEMENTED);
}
