/**
 * @tracepoint-dev/core — framework-agnostic entry point.
 */
export {
  type DescriptorContributor,
  registerDescriptorContributor,
} from "./capture/contributors.js";
export { SDK_VERSION as VERSION } from "./constants.js";
export { getInstance, subscribeInstance, tracepoint } from "./tracepoint.js";
export type {
  Annotation,
  ButtonConfig,
  ConsoleCaptureConfig,
  ConsoleLevel,
  DescriptorBundle,
  DescriptorComponentInfo,
  Labels,
  NetworkCaptureConfig,
  Rect,
  RedactConfig,
  Screenshot,
  SelectorConfidence,
  SendInput,
  SubmitResult,
  ThemeConfig,
  TracepointConfig,
  TracepointHandle,
  UiConfig,
} from "./types.js";
