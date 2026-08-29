/**
 * Entry for the `<script src>` IIFE build.
 *
 * Exposes `window.tracepoint` (the same factory as the npm import) and, when the
 * loading `<script>` carries a `data-webhook`, auto-initialises from its data-*
 * attributes — the zero-build getting-started path.
 */
import { tracepoint } from "./tracepoint.js";
import type { TracepointConfig } from "./types.js";

declare global {
  interface Window {
    tracepoint?: typeof tracepoint;
  }
}

window.tracepoint = tracepoint;

const script = document.currentScript as HTMLScriptElement | null;
const webhook = script?.dataset.webhook;

if (webhook) {
  const config: TracepointConfig = { webhook };
  if (script?.dataset.env) config.env = script.dataset.env;
  if (script?.dataset.release) config.release = script.dataset.release;
  if (script?.dataset.button === "false") config.button = false;
  tracepoint(config);
}
