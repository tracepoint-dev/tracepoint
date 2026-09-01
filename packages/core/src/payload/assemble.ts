/**
 * Build the frozen report envelope from the in-progress {@link Draft}.
 *
 * Called at SUBMIT time — it snapshots whatever the draft holds, screenshot
 * included or still `null` (ADR 0001 D4). No waiting on capture.
 *
 * Schema v2 (ADR 0004): also carries `console` / `errors` / `network` / `capture`
 * from the collector snapshot, or empty arrays when diagnostics are not opted in.
 */
import { SCHEMA_VERSION, SDK_VERSION } from "../constants.js";
import type { CollectorSnapshot, Draft, Payload } from "../internal-types.js";
import { cleanUrl } from "../privacy/url.js";
import { readClientEnv } from "./client-env.js";

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const rand = Math.random().toString(36).slice(2, 10);
  return `tp_${Date.now().toString(36)}_${rand}`;
}

function readPage(urlParams: readonly string[]): Payload["page"] {
  return {
    url: cleanUrl(location.href, urlParams),
    // `route` is a logical pattern (/users/:id). Core only knows the raw URL;
    // adapters may inject a matched route via context.
    route: null,
    title: document.title,
    referrer: document.referrer ? cleanUrl(document.referrer, urlParams) : null,
  };
}

export function assemblePayload(
  draft: Draft,
  context: Record<string, unknown>,
  snapshot?: CollectorSnapshot,
  urlParams: readonly string[] = [],
): Payload {
  return {
    tracepoint: { schemaVersion: SCHEMA_VERSION, sdkVersion: SDK_VERSION },
    id: newId(),
    createdAt: new Date().toISOString(),
    report: {
      description: draft.description,
      annotations: [...draft.annotations],
    },
    target: draft.target,
    page: readPage(urlParams),
    screenshot: draft.screenshot,
    client: readClientEnv(),
    context: { ...context },
    console: snapshot ? [...snapshot.console] : [],
    errors: snapshot ? [...snapshot.errors] : [],
    network: snapshot ? [...snapshot.network] : [],
    capture: {
      console: snapshot?.enabled.console ?? false,
      network: snapshot?.enabled.network ?? false,
      truncated: {},
    },
  };
}
