/** Shared constants for @tracepoint-dev/core. */

/**
 * Package version. Replaced at build time with `package.json` `version` via the
 * `__TP_SDK_VERSION__` esbuild define in `tsup.config.ts`. Falls back to `"0.0.0"`
 * for un-bundled runs (Vitest, `vite dev`), where the token is never defined.
 */
declare const __TP_SDK_VERSION__: string | undefined;
export const SDK_VERSION: string =
  typeof __TP_SDK_VERSION__ === "string" ? __TP_SDK_VERSION__ : "0.0.0";

/** Version of the report payload envelope. Moves independently of SDK_VERSION. */
export const SCHEMA_VERSION = "1.0";

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
