/**
 * Config validation and normalisation.
 *
 * Rule (ADR 0001 D3): throw only on a bad `webhook`; warn and coerce/ignore for
 * everything else. A missing `webhook` is allowed — it selects the console transport.
 */
import { normalizeUi } from "./config-ui.js";
import {
  CONSOLE_LEVELS,
  DEFAULT_CONSOLE_LIMIT,
  DEFAULT_CONSOLE_MAX_ENTRY_BYTES,
  DEFAULT_CONSOLE_TOTAL_BYTES,
  DEFAULT_NETWORK_LIMIT,
  SENSITIVE_URL_PARAMS,
} from "./constants.js";
import type {
  NormalizedConfig,
  NormalizedConsoleCapture,
  NormalizedNetworkCapture,
} from "./internal-types.js";
import type { ConsoleLevel, TracepointConfig } from "./types.js";
import { warnOnce } from "./util/logger.js";

const KNOWN_KEYS = new Set<keyof TracepointConfig>([
  "webhook",
  "env",
  "release",
  "context",
  "redact",
  "console",
  "network",
  "ui",
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

function filterStrings(raw: unknown[], key: string): string[] {
  const strings = raw.filter((s): s is string => typeof s === "string");
  if (strings.length !== raw.length) {
    warnOnce(`config:${key}:items`, `\`${key}\` had non-string entries; those were dropped.`);
  }
  return strings;
}

interface NormalizedRedact {
  selectors: string[];
  text: ((value: string) => string) | null;
  urlParams: string[];
  pii: boolean;
}

function normalizeRedact(raw: unknown): NormalizedRedact {
  const out: NormalizedRedact = {
    selectors: [],
    text: null,
    urlParams: [...SENSITIVE_URL_PARAMS],
    pii: false,
  };
  if (raw === undefined) return out;

  if (Array.isArray(raw)) {
    out.selectors = filterStrings(raw, "redact");
    return out;
  }
  if (!isPlainObject(raw)) {
    warnOnce(
      "config:redact",
      "`redact` must be an array of selectors or a config object; ignoring.",
    );
    return out;
  }

  if (raw.selectors !== undefined) {
    if (Array.isArray(raw.selectors))
      out.selectors = filterStrings(raw.selectors, "redact.selectors");
    else warnOnce("config:redact:selectors", "`redact.selectors` must be an array; ignoring.");
  }
  if (raw.text !== undefined) {
    if (typeof raw.text === "function") out.text = raw.text as (value: string) => string;
    else warnOnce("config:redact:text", "`redact.text` must be a function; ignoring.");
  }
  if (raw.urlParams !== undefined) {
    if (Array.isArray(raw.urlParams)) {
      const extra = filterStrings(raw.urlParams, "redact.urlParams").map((s) => s.toLowerCase());
      out.urlParams = [...new Set([...out.urlParams, ...extra])];
    } else {
      warnOnce("config:redact:urlParams", "`redact.urlParams` must be an array; ignoring.");
    }
  }
  if (raw.pii !== undefined) out.pii = raw.pii === true;
  return out;
}

function normalizeConsoleCapture(raw: unknown): NormalizedConsoleCapture | null {
  if (raw === undefined || raw === false) return null;
  const out: NormalizedConsoleCapture = {
    levels: [...CONSOLE_LEVELS],
    limit: DEFAULT_CONSOLE_LIMIT,
    maxEntryBytes: DEFAULT_CONSOLE_MAX_ENTRY_BYTES,
    totalBytes: DEFAULT_CONSOLE_TOTAL_BYTES,
  };
  if (raw === true) return out;
  if (!isPlainObject(raw)) {
    warnOnce("config:console", "`console` must be `true` or an options object; ignoring.");
    return null;
  }
  if (Array.isArray(raw.levels)) {
    const valid = raw.levels.filter((l): l is ConsoleLevel =>
      (CONSOLE_LEVELS as readonly string[]).includes(l as string),
    );
    if (valid.length > 0) out.levels = valid;
    else warnOnce("config:console:levels", "`console.levels` had no valid levels; using all.");
  }
  if (typeof raw.limit === "number" && raw.limit > 0) out.limit = Math.floor(raw.limit);
  if (typeof raw.maxEntryBytes === "number" && raw.maxEntryBytes > 0) {
    out.maxEntryBytes = Math.floor(raw.maxEntryBytes);
  }
  return out;
}

function normalizeNetworkCapture(raw: unknown): NormalizedNetworkCapture | null {
  if (raw === undefined || raw === false) return null;
  const out: NormalizedNetworkCapture = { limit: DEFAULT_NETWORK_LIMIT, denyUrls: [] };
  if (raw === true) return out;
  if (!isPlainObject(raw)) {
    warnOnce("config:network", "`network` must be `true` or an options object; ignoring.");
    return null;
  }
  if (typeof raw.limit === "number" && raw.limit > 0) out.limit = Math.floor(raw.limit);
  if (Array.isArray(raw.denyUrls)) {
    out.denyUrls = raw.denyUrls.filter(
      (u): u is string | RegExp => typeof u === "string" || u instanceof RegExp,
    );
  }
  return out;
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

  let context: Record<string, unknown> = {};
  let contextFn: (() => Record<string, unknown>) | null = null;
  if (typeof input.context === "function") {
    contextFn = input.context as () => Record<string, unknown>;
  } else if (input.context !== undefined) {
    if (isPlainObject(input.context)) context = { ...input.context };
    else warnOnce("config:context", "`context` must be a plain object or a function; ignoring.");
  }

  const redact = normalizeRedact(input.redact);
  const { headless, ui } = normalizeUi(input.ui);

  return Object.freeze({
    webhook: normalizeWebhook(input.webhook),
    env: normalizeString(input.env, "env"),
    release: normalizeString(input.release, "release"),
    context,
    contextFn,
    redact: redact.selectors,
    redactText: redact.text,
    redactUrlParams: redact.urlParams,
    redactPii: redact.pii,
    console: normalizeConsoleCapture(input.console),
    network: normalizeNetworkCapture(input.network),
    headless,
    ui,
  });
}
