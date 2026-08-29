/**
 * Build the frozen report envelope from the in-progress {@link Draft}.
 *
 * Called at SUBMIT time — it snapshots whatever the draft holds, screenshot
 * included or still `null` (ADR 0001 D4). No waiting on capture.
 */
import { SCHEMA_VERSION, SDK_VERSION } from "../constants.js";
import type { Draft, Payload } from "../internal-types.js";
import { readClientEnv } from "./client-env.js";

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const rand = Math.random().toString(36).slice(2, 10);
  return `tp_${Date.now().toString(36)}_${rand}`;
}

function readPage(): Payload["page"] {
  return {
    url: location.href,
    // `route` is a logical pattern (/users/:id). Core only knows the raw URL;
    // adapters may inject a matched route via context.
    route: null,
    title: document.title,
    referrer: document.referrer || null,
  };
}

export function assemblePayload(draft: Draft, context: Record<string, unknown>): Payload {
  return {
    tracepoint: { schemaVersion: SCHEMA_VERSION, sdkVersion: SDK_VERSION },
    id: newId(),
    createdAt: new Date().toISOString(),
    report: {
      description: draft.description,
      annotations: [...draft.annotations],
    },
    target: draft.target,
    page: readPage(),
    screenshot: draft.screenshot,
    client: readClientEnv(),
    context: { ...context },
  };
}
