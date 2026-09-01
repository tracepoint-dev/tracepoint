/**
 * Uncaught-error collector (ADR 0004). Rides with `console` capture. Listens for
 * `error` and `unhandledrejection` on `window`; keeps a redacted record with the
 * stack, query strings scrubbed from frame URLs (guardrail: keep file:line, drop
 * anything that could be a token in a URL).
 */
import type { ErrorEntry } from "../internal-types.js";
import { createRingBuffer } from "./ring-buffer.js";

type Redactor = (value: string) => string;

const LIMIT = 25;
const FRAME_QUERY = /(https?:\/\/[^\s):]+?)\?[^\s):]*/g;

export interface ErrorCollector {
  snapshot(): ErrorEntry[];
  destroy(): void;
}

export function createErrorCollector(redact: Redactor): ErrorCollector {
  const buffer = createRingBuffer<ErrorEntry>({ limit: LIMIT });

  const scrub = (stack: string): string => redact(stack.replace(FRAME_QUERY, "$1"));
  const now = (): number => Math.round(performance.now());

  const onError = (e: ErrorEvent): void => {
    const err = e.error instanceof Error ? e.error : null;
    buffer.push({
      name: err?.name ?? "Error",
      message: redact(String(e.message ?? err?.message ?? "")),
      stack: err?.stack ? scrub(err.stack) : "",
      ts: now(),
      kind: "error",
    });
  };

  const onRejection = (e: PromiseRejectionEvent): void => {
    const reason = e.reason;
    const err = reason instanceof Error ? reason : null;
    buffer.push({
      name: err?.name ?? "UnhandledRejection",
      message: redact(err ? err.message : String(reason)),
      stack: err?.stack ? scrub(err.stack) : "",
      ts: now(),
      kind: "rejection",
    });
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  return {
    snapshot: () => buffer.toArray(),
    destroy() {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      buffer.clear();
    },
  };
}
