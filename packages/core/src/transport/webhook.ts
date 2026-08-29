/**
 * WebhookTransport — one JSON POST, with 2 retries on network error or 5xx
 * (never on 4xx; that is a config problem retrying won't fix). ADR 0001 / §10.
 */
import type { Payload } from "../internal-types.js";
import { withRetry } from "./retry.js";
import type { SubmitResult, Transport } from "./types.js";

const BACKOFF_MS = [1_000, 4_000];

async function postOnce(url: string, payload: Payload): Promise<SubmitResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return { ok: true, status: res.status };
    return { ok: false, status: res.status, error: `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** `retryOn`: no status = network error; status >= 500 = server error. */
function shouldRetry(r: SubmitResult): boolean {
  return !r.ok && (r.status === undefined || r.status >= 500);
}

export function createWebhookTransport(url: string): Transport {
  return {
    submit: (payload) =>
      withRetry(() => postOnce(url, payload), {
        retries: 2,
        backoffMs: BACKOFF_MS,
        retryOn: shouldRetry,
      }),
  };
}
