/**
 * ConsoleTransport — the default when no `webhook` is set. Logs the payload so the
 * SDK does something visible the moment it is installed. The panel wires a
 * "download JSON" button to {@link downloadJson}.
 */
import type { Payload } from "../internal-types.js";
import { info } from "../util/logger.js";
import type { Transport } from "./types.js";

export function createConsoleTransport(): Transport {
  return {
    async submit(payload) {
      info("no webhook configured — report payload logged below:");
      console.log(payload);
      return { ok: true };
    },
  };
}

/** Trigger a browser download of the payload as pretty JSON. No-op outside a DOM. */
export function downloadJson(payload: Payload): void {
  if (typeof document === "undefined" || typeof URL?.createObjectURL !== "function") return;
  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `tracepoint-${payload.id}.json`;
    a.click();
    URL.revokeObjectURL(href);
  } catch {
    // a download is a convenience; never let it break submit
  }
}
