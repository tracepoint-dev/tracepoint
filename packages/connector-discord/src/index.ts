/**
 * @tracepoint-dev/connector-discord
 *
 * Turns a Tracepoint report payload into a Discord webhook request. Meant to run
 * inside your receiver (serverless function / server), never in the browser.
 *
 * M0 scaffold: exports the shape it reads plus a `toDiscordMessage()` stub.
 * Real formatting (embed + screenshot attachment) lands in milestone M3.
 */

/** The subset of a Tracepoint payload this connector reads. */
export interface TracepointPayloadLike {
  report: { description: string };
  page: { url: string };
  screenshot?: { dataUrl: string; mimeType: string } | null;
}

/** A Discord webhook request: JSON body, optionally with a file attachment. */
export interface DiscordRequest {
  body: Record<string, unknown>;
  file?: { name: string; content: Uint8Array };
}

const NOT_IMPLEMENTED = "toDiscordMessage(): formatting lands in Phase 1 milestone M3";

/** Format a payload as a Discord webhook request. */
export function toDiscordMessage(_payload: TracepointPayloadLike): DiscordRequest {
  throw new Error(NOT_IMPLEMENTED);
}
