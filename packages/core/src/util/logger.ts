/** Prefixed console output. Kept in one place so the prefix and dedupe live together. */

const PREFIX = "[tracepoint]";
const seen = new Set<string>();

export function info(message: string): void {
  console.info(`${PREFIX} ${message}`);
}

export function warn(message: string): void {
  console.warn(`${PREFIX} ${message}`);
}

/** Warn at most once per `key` for the life of the page. */
export function warnOnce(key: string, message: string): void {
  if (seen.has(key)) return;
  seen.add(key);
  warn(message);
}

/** Test hook — clear the warn-once memory between cases. */
export function _resetWarnings(): void {
  seen.clear();
}
