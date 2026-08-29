/**
 * @tracepoint-dev/core — framework-agnostic entry point.
 *
 * M1 in progress: `tracepoint()` validates config and enforces the singleton.
 * The capture pipeline (button, picker, screenshot, payload, transport) is being
 * built up per ADR 0001.
 */
export { SDK_VERSION as VERSION } from "./constants.js";
export { tracepoint } from "./tracepoint.js";
export type { TracepointConfig, TracepointHandle } from "./types.js";
