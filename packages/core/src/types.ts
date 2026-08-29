/**
 * Public type contract for @tracepoint-dev/core.
 *
 * These types are the frozen Phase 1 API (see docs/04-phase-1-plan.html).
 * Implementations land in milestone M1; the shapes here should not churn.
 */

/** Configuration accepted by `tracepoint()`. `webhook` is the only required field. */
export interface TracepointConfig {
  /** URL the finished report is POSTed to. */
  webhook: string;
  /** Free-form environment label, e.g. `"staging"`. */
  env?: string;
  /** App release / version string attached to every report. */
  release?: string;
  /** Static key/values merged into every report's `context`. */
  context?: Record<string, unknown>;
  /** Show the floating button. Default `true`; `false` = you trigger it. */
  button?: boolean;
  /** CSS selectors whose matched elements are blanked in screenshots. */
  redact?: string[];
}

/** Handle returned by `tracepoint()`. */
export interface TracepointHandle {
  /** Open the reporter. */
  open(): void;
  /** Close the reporter without submitting. */
  close(): void;
  /** Merge more key/values into the context sent with future reports. */
  setContext(context: Record<string, unknown>): void;
  /** Tear everything down and unbind listeners. */
  destroy(): void;
}
