/**
 * Enforce the assembled-envelope size ceilings (ADR 0004 D7).
 *
 * Measured as JSON bytes with the screenshot data URL excluded (the screenshot
 * is already bounded by its own capture path). Over the soft ceiling: trim
 * `console` then `network`, oldest first, recording the counts in
 * `capture.truncated`. Still over the hard ceiling afterwards: report `oversize`
 * so the caller refuses to send rather than emit a payload a receiver may reject.
 */
import { PAYLOAD_HARD_CEILING_BYTES, PAYLOAD_SOFT_CEILING_BYTES } from "../constants.js";
import type { Payload } from "../internal-types.js";

function measure(payload: Payload): number {
  const shot = payload.screenshot;
  const withoutShot = shot ? { ...payload, screenshot: { ...shot, dataUrl: "" } } : payload;
  return JSON.stringify(withoutShot).length;
}

export interface SizeResult {
  payload: Payload;
  /** `true` when the payload is still over the hard ceiling after trimming. */
  oversize: boolean;
}

export function enforceSize(payload: Payload): SizeResult {
  if (measure(payload) <= PAYLOAD_SOFT_CEILING_BYTES) {
    return { payload, oversize: false };
  }

  let consoleDropped = 0;
  while (payload.console.length > 0 && measure(payload) > PAYLOAD_SOFT_CEILING_BYTES) {
    payload.console.shift();
    consoleDropped++;
  }

  let networkDropped = 0;
  while (payload.network.length > 0 && measure(payload) > PAYLOAD_SOFT_CEILING_BYTES) {
    payload.network.shift();
    networkDropped++;
  }

  if (consoleDropped > 0) payload.capture.truncated.console = consoleDropped;
  if (networkDropped > 0) payload.capture.truncated.network = networkDropped;

  return { payload, oversize: measure(payload) > PAYLOAD_HARD_CEILING_BYTES };
}
