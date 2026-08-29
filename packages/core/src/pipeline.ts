// The capture primitives, framing-agnostic. Both the built-in UI runtime and the
// headless runtime call these so the two paths stay identical underneath.
import type { Draft } from "./internal-types.js";
import { assemblePayload } from "./payload/assemble.js";
import { withRedaction } from "./privacy/redact.js";
import { captureScreenshot } from "./screenshot/capture.js";
import { createConsoleTransport } from "./transport/console.js";
import type { Transport } from "./transport/types.js";
import { createWebhookTransport } from "./transport/webhook.js";
import type { Screenshot, SendInput, SubmitResult } from "./types.js";

export function pickTransport(webhook: string | null): Transport {
  return webhook ? createWebhookTransport(webhook) : createConsoleTransport();
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
): Promise<SubmitResult> {
  const target = input.target ?? null;
  const draft: Draft = {
    description: input.description ?? "",
    target,
    screenshot: input.screenshot ?? null,
    annotations:
      input.annotations ?? (target ? [{ type: "selection-rect", rect: target.boundingRect }] : []),
  };
  return transport.submit(assemblePayload(draft, context));
}
