import type { SubmitResult } from "./types.js";

export interface RetryOptions {
  /** Extra attempts after the first. */
  retries: number;
  /** Delay before retry n (ms). The last value is reused if the array is short. */
  backoffMs: number[];
  /** Return true to retry the given result. */
  retryOn: (result: SubmitResult) => boolean;
  /** Injectable for tests. */
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Run `fn`, retrying while `retryOn` says so, up to `retries` extra attempts. */
export async function withRetry(
  fn: () => Promise<SubmitResult>,
  opts: RetryOptions,
): Promise<SubmitResult> {
  const sleep = opts.sleep ?? defaultSleep;
  const last = opts.backoffMs[opts.backoffMs.length - 1] ?? 0;

  let result = await fn();
  for (let i = 0; i < opts.retries; i++) {
    if (!opts.retryOn(result)) return result;
    await sleep(opts.backoffMs[i] ?? last);
    result = await fn();
  }
  return result;
}
