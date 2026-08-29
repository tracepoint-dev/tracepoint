import type { ScreenshotInput } from "../types.js";

interface EnvelopeScreenshot {
  mimeType?: string;
  dataUrl?: string;
  width?: number;
  height?: number;
}

/**
 * Pull the screenshot out of a raw envelope: decode its data URL to bytes and
 * return the envelope with the (large) `dataUrl` removed.
 */
export function extractScreenshot(payload: Record<string, unknown>): {
  payload: Record<string, unknown>;
  screenshot: ScreenshotInput | null;
} {
  const raw = payload.screenshot as EnvelopeScreenshot | null | undefined;
  if (!raw || typeof raw.dataUrl !== "string") {
    return { payload, screenshot: null };
  }

  const comma = raw.dataUrl.indexOf(",");
  const meta = raw.dataUrl.slice(0, comma);
  const body = raw.dataUrl.slice(comma + 1);
  const mimeType = raw.mimeType ?? meta.slice(5, meta.indexOf(";")) ?? "image/png";
  const bytes = meta.includes("base64")
    ? Uint8Array.from(Buffer.from(body, "base64"))
    : new TextEncoder().encode(decodeURIComponent(body));

  const stripped = {
    ...payload,
    screenshot: { mimeType, width: raw.width ?? 0, height: raw.height ?? 0 },
  };

  return {
    payload: stripped,
    screenshot: { mimeType, width: raw.width ?? 0, height: raw.height ?? 0, bytes },
  };
}

export function dataUrl(mimeType: string, bytes: Uint8Array): string {
  return `data:${mimeType};base64,${Buffer.from(bytes).toString("base64")}`;
}
