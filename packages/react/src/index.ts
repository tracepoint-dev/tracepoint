/**
 * @tracepoint-dev/react — React adapter.
 *
 * A thin wrapper over @tracepoint-dev/core: lifecycle (mount/unmount), SSR safety
 * (no work during server render), and prop reactivity. No capture, screenshot,
 * transport, redaction, or payload logic lives here.
 */
export { Tracepoint, type TracepointProps } from "./tracepoint-component.js";
export { useTracepoint } from "./use-tracepoint.js";
export type {
  DescriptorBundle,
  Screenshot,
  SendInput,
  SubmitResult,
  TracepointConfig,
  TracepointHandle,
  UiConfig,
} from "@tracepoint-dev/core";
