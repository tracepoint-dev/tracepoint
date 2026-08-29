/**
 * Config validation and normalisation.
 *
 * Rule (ADR 0001 D3): throw only on a bad `webhook`; warn and coerce/ignore for
 * everything else. A missing `webhook` is allowed — it selects the console transport.
 */
import type { NormalizedConfig } from "./internal-types.js";
import type { TracepointConfig } from "./types.js";
import { warnOnce } from "./util/logger.js";

const KNOWN_KEYS = new Set<keyof TracepointConfig>([
  "webhook",
  "env",
  "release",
  "context",
  "button",
  "redact",
]);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function normalizeWebhook(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "string" || !/^https?:\/\//i.test(raw)) {
    throw new TypeError(
      "[tracepoint] `webhook` must be an http(s) URL string (or omitted for console-only mode)",
    );
  }
  return raw;
}

function normalizeString(raw: unknown, key: string): string | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "string") {
    warnOnce(`config:${key}`, `\`${key}\` must be a string; ignoring.`);
    return null;
  }
  return raw;
}

function normalizeRedact(raw: unknown): string[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    warnOnce("config:redact", "`redact` must be an array of CSS selectors; ignoring.");
    return [];
  }
  const strings = raw.filter((s): s is string => typeof s === "string");
  if (strings.length !== raw.length) {
    warnOnce("config:redact:items", "`redact` had non-string entries; those were dropped.");
  }
  return strings;
}

function warnUnknownKeys(input: Record<string, unknown>): void {
  const unknown = Object.keys(input).filter((k) => !KNOWN_KEYS.has(k as keyof TracepointConfig));
  if (unknown.length > 0) {
    warnOnce("config:unknown", `unknown config keys ignored: ${unknown.join(", ")}`);
  }
}

/** Validate raw user config into a frozen {@link NormalizedConfig}. */
export function normalizeConfig(input: unknown): NormalizedConfig {
  if (!isPlainObject(input)) {
    throw new TypeError("[tracepoint] config must be an object");
  }
  warnUnknownKeys(input);

  let button = true;
  if (input.button !== undefined) {
    if (typeof input.button !== "boolean") {
      warnOnce("config:button", "`button` must be a boolean; coercing.");
    }
    button = Boolean(input.button);
  }

  let context: Record<string, unknown> = {};
  if (input.context !== undefined) {
    if (isPlainObject(input.context)) {
      context = { ...input.context };
    } else {
      warnOnce("config:context", "`context` must be a plain object; ignoring.");
    }
  }

  return Object.freeze({
    webhook: normalizeWebhook(input.webhook),
    env: normalizeString(input.env, "env"),
    release: normalizeString(input.release, "release"),
    context,
    button,
    redact: normalizeRedact(input.redact),
  });
}
