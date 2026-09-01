/**
 * Strip sensitive query-string values from a URL (ADR 0004 D5). The key is kept
 * — its presence is signal; the value is the risk. Used for captured network
 * URLs and (P2.5) `page.url` / `page.referrer`.
 */

const PLACEHOLDER = "REDACTED";

export function cleanUrl(raw: string, sensitiveParams: readonly string[]): string {
  if (!raw || (!raw.includes("?") && !raw.includes("#"))) return raw;
  const base = typeof location !== "undefined" ? location.href : "http://localhost/";
  let url: URL;
  try {
    url = new URL(raw, base);
  } catch {
    return raw;
  }

  const deny = new Set(sensitiveParams.map((p) => p.toLowerCase()));
  let touched = false;
  for (const key of [...url.searchParams.keys()]) {
    if (deny.has(key.toLowerCase())) {
      url.searchParams.set(key, PLACEHOLDER);
      touched = true;
    }
  }
  if (!touched) return raw;

  // Preserve the original form (absolute vs. path-only) as far as reasonable.
  return raw.startsWith("http") || raw.startsWith("//")
    ? url.toString()
    : url.pathname + url.search + url.hash;
}
