/**
 * App-context preparation (ADR 0004 / Phase 2 P2.4).
 *
 * The developer owns what goes in `context`, but we still: run the `redact.text`
 * hook (and, from P2.5, the PII preset) over every string value, and cap the
 * serialized size so an oversized blob can't bloat every report.
 */

const DEFAULT_MAX_BYTES = 16 * 1_024;
const MAX_DEPTH = 6;

function redactDeep(
  value: unknown,
  fn: (s: string) => string,
  depth: number,
  seen: WeakSet<object>,
): unknown {
  if (typeof value === "string") return fn(value);
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return "[Circular]";
  if (depth >= MAX_DEPTH) return Array.isArray(value) ? "[Array]" : "[Object]";
  seen.add(value);
  try {
    if (Array.isArray(value)) return value.map((v) => redactDeep(v, fn, depth + 1, seen));
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redactDeep(v, fn, depth + 1, seen);
    }
    return out;
  } finally {
    seen.delete(value);
  }
}

export interface PrepareContextOptions {
  redactText?: ((value: string) => string) | null;
  maxBytes?: number;
}

function jsonLength(value: unknown): number {
  try {
    return JSON.stringify(value)?.length ?? 0;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

/**
 * Redact + size-cap an app-context object. Over the byte cap, keys are kept in
 * insertion order until the budget runs out; a `__tracepointNote` records how
 * many were dropped.
 */
export function prepareContext(
  raw: Record<string, unknown>,
  opts: PrepareContextOptions = {},
): Record<string, unknown> {
  const fn = opts.redactText;
  const max = opts.maxBytes ?? DEFAULT_MAX_BYTES;

  const ctx = (fn ? redactDeep(raw, fn, 0, new WeakSet()) : { ...raw }) as Record<string, unknown>;

  if (jsonLength(ctx) <= max) return ctx;

  const out: Record<string, unknown> = {};
  let omitted = 0;
  for (const [key, value] of Object.entries(ctx)) {
    if (jsonLength({ ...out, [key]: value }) <= max) out[key] = value;
    else omitted++;
  }
  out.__tracepointNote = `context trimmed: ${omitted} key(s) omitted to stay under ${max} bytes`;
  return out;
}
