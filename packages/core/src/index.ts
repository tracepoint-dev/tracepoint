/**
 * @tracepoint-dev/core — framework-agnostic entry point.
 */
export { SDK_VERSION as VERSION } from "./constants.js";
export { getInstance, subscribeInstance, tracepoint } from "./tracepoint.js";
export type {
  Annotation,
  ButtonConfig,
  DescriptorBundle,
  Labels,
  Rect,
  Screenshot,
  SelectorConfidence,
  SendInput,
  SubmitResult,
  ThemeConfig,
  TracepointConfig,
  TracepointHandle,
  UiConfig,
} from "./types.js";
