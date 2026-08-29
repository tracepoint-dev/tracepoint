import type { Payload } from "../internal-types.js";

/** Outcome of one submit. `status` is the HTTP status when there was a response. */
export interface SubmitResult {
  ok: boolean;
  status?: number;
  error?: string;
}

/**
 * A sink for finished reports. Implementations: webhook POST, hosted API, custom.
 * No database or integration logic belongs here (see architecture guardrails).
 */
export interface Transport {
  submit(payload: Payload): Promise<SubmitResult>;
}
