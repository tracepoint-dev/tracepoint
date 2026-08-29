import type { Payload } from "../internal-types.js";
import type { SubmitResult } from "../types.js";

export type { SubmitResult };

/**
 * A sink for finished reports. Implementations: webhook POST, hosted API, custom.
 * No database or integration logic belongs here (see architecture guardrails).
 */
export interface Transport {
  submit(payload: Payload): Promise<SubmitResult>;
}
