/**
 * @tracepoint-dev/webhook-kit — mountable receiver for Tracepoint reports.
 * Stores are in `./stores`, outbound handlers in `./connectors`, the dashboard
 * in `./dashboard`, framework glue in `./express`.
 */
export { createReceiver } from "./receiver.js";
export type {
  Handler,
  HandlerCtx,
  ListOptions,
  Receiver,
  ReceiverOptions,
  ReportStatus,
  ReportSummary,
  RetentionOptions,
  SaveInput,
  ScreenshotInput,
  Store,
  StoredReport,
} from "./types.js";
