/** Shared constants for @tracepoint-dev/core. */

/**
 * Package version. Replaced at build time with `package.json` `version` via the
 * `__TP_SDK_VERSION__` esbuild define in `tsup.config.ts`. Falls back to `"0.0.0"`
 * for un-bundled runs (Vitest, `vite dev`), where the token is never defined.
 */
declare const __TP_SDK_VERSION__: string | undefined;
export const SDK_VERSION: string =
  typeof __TP_SDK_VERSION__ === "string" ? __TP_SDK_VERSION__ : "0.0.0";

/**
 * Version of the report payload envelope. Moves independently of SDK_VERSION.
 * `2.0` (Phase 2): additive — `console` / `errors` / `network` / `capture` top-level
 * keys plus `target.component`. Every v1 field keeps its name, type, and meaning.
 */
export const SCHEMA_VERSION = "2.0";

/** id of the shadow host element mounted on `<html>`. */
export const ROOT_ID = "tracepoint-root";

/** How long a single screenshot attempt may run before it is abandoned. */
export const SCREENSHOT_TIMEOUT_MS = 15_000;

/** Guard for the selector generator, which can pathologically backtrack. */
export const FINDER_TIMEOUT_MS = 1_500;

/** Selectors whose matched elements are blanked before a screenshot is taken. */
export const DEFAULT_REDACT: readonly string[] = [
  'input[type="password"]',
  '[autocomplete^="cc-"]',
  '[autocomplete="cc-number"]',
  ".tp-redact",
  "[data-tp-redact]",
];

/** HTML attributes safe to copy into the descriptor bundle verbatim. */
export const ATTR_ALLOW: readonly string[] = [
  "id",
  "class",
  "role",
  "name",
  "type",
  "href",
  "alt",
  "title",
  "placeholder",
  "for",
];

/** `data-*` attributes kept despite the "no blanket data-*" rule. */
export const TEST_ID_ATTRS: readonly string[] = ["data-testid", "data-test", "data-cy"];

/** Input types whose `value` is never captured. */
export const SENSITIVE_INPUT_TYPES: readonly string[] = ["password", "hidden"];

// ---------------------------------------------------------------- Phase 2 capture

/** Console levels the collector can be asked to keep. */
export const CONSOLE_LEVELS = ["log", "info", "warn", "error", "debug"] as const;

/** Ring-buffer defaults (ADR 0004 D7 / plan D5). All overridable via config. */
export const DEFAULT_CONSOLE_LIMIT = 50;
export const DEFAULT_CONSOLE_MAX_ENTRY_BYTES = 4_096;
export const DEFAULT_CONSOLE_TOTAL_BYTES = 32_768;
export const DEFAULT_NETWORK_LIMIT = 50;

/**
 * Assembled-envelope size ceilings, measured as JSON bytes with the screenshot
 * data URL excluded (ADR 0004 D7). Over the soft ceiling: trim console then
 * network, oldest first. Over the hard ceiling: refuse to send.
 */
export const PAYLOAD_SOFT_CEILING_BYTES = 512 * 1_024;
export const PAYLOAD_HARD_CEILING_BYTES = 2 * 1_024 * 1_024;

/**
 * Query-string keys whose value is scrubbed from every captured URL and from
 * `page.url` / `page.referrer` (ADR 0004 D5). The key is kept — its presence is
 * signal; the value is the risk. User `redact.urlParams` extend this list.
 */
export const SENSITIVE_URL_PARAMS: readonly string[] = [
  "token",
  "access_token",
  "refresh_token",
  "id_token",
  "key",
  "api_key",
  "apikey",
  "secret",
  "client_secret",
  "password",
  "pwd",
  "auth",
  "authorization",
  "sig",
  "signature",
  "code",
  "session",
  "sid",
];
