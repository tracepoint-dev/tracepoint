// The capture primitives, framing-agnostic. Both the built-in UI runtime and the
// headless runtime call these so the two paths stay identical underneath.
import type { CollectorSnapshot, Draft, NormalizedConfig } from "./internal-types.js";
import { assemblePayload } from "./payload/assemble.js";
import { prepareContext } from "./payload/context.js";
import { enforceSize } from "./payload/size.js";
import { createTextRedactor } from "./privacy/redact-text.js";
import { withRedaction } from "./privacy/redact.js";
import { captureScreenshot } from "./screenshot/capture.js";
import { createConsoleTransport } from "./transport/console.js";
import type { Transport } from "./transport/types.js";
import { createWebhookTransport } from "./transport/webhook.js";
import type { Screenshot, SendInput, SubmitResult } from "./types.js";

export function pickTransport(webhook: string | null): Transport {
  return webhook ? createWebhookTransport(webhook) : createConsoleTransport();
}

/**
 * Merge the live context (static seed + `setContext()` patches) with the
 * function-form `context` evaluated now, then redact + size-cap it. Live values
 * win over the function's on a key clash. A throwing context function is ignored.
 */
export function resolveContext(
  config: NormalizedConfig,
  live: Record<string, unknown>,
): Record<string, unknown> {
  let fromFn: Record<string, unknown> = {};
  if (config.contextFn) {
    try {
      const result = config.contextFn();
      if (result && typeof result === "object" && !Array.isArray(result)) fromFn = result;
    } catch {
      // a broken context provider must not break the report
    }
  }
  return prepareContext({ ...fromFn, ...live }, { redactText: createTextRedactor(config) });
}

/** Screenshot with redaction applied. */
export function runScreenshot(
  redact: string[],
  opts?: { fullPage?: boolean },
): Promise<Screenshot | null> {
  return withRedaction(redact, () => captureScreenshot(opts));
}

/** Assemble the envelope from a partial input and submit it. */
export function runSend(
  input: SendInput,
  context: Record<string, unknown>,
  transport: Transport,
  snapshot?: CollectorSnapshot,
  urlParams: readonly string[] = [],
): Promise<SubmitResult> {
  const target = input.target ?? null;
  const draft: Draft = {
    description: input.description ?? "",
    target,
    screenshot: input.screenshot ?? null,
    annotations:
      input.annotations ?? (target ? [{ type: "selection-rect", rect: target.boundingRect }] : []),
  };
  const { payload, oversize } = enforceSize(assemblePayload(draft, context, snapshot, urlParams));
  if (oversize) {
    return Promise.resolve({ ok: false, error: "payload too large" });
  }
  return transport.submit(payload);
}
