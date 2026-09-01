/**
 * Network collector (ADR 0004 D6) — metadata only.
 *
 * Wraps `fetch` and `XMLHttpRequest`. Records method, cleaned URL, status,
 * duration, and byte counts from `Content-Length` — never request/response
 * bodies or headers. The SDK's own webhook POST and any `denyUrls` match are
 * skipped. Restores the originals on `destroy()` if they are still ours.
 */
import type { NetworkEntry, NormalizedNetworkCapture } from "../internal-types.js";
import { cleanUrl } from "../privacy/url.js";
import { createRingBuffer } from "./ring-buffer.js";

export interface NetworkCollectorOptions {
  /** The SDK's own webhook URL — its requests are never recorded. */
  selfUrl: string | null;
  /** Built-in + user sensitive query keys to scrub from recorded URLs. */
  urlParams: string[];
}

export interface NetworkCollector {
  snapshot(): NetworkEntry[];
  destroy(): void;
}

type FetchFn = typeof fetch;
type XhrOpen = XMLHttpRequest["open"];
type XhrSend = XMLHttpRequest["send"];

interface XhrMeta {
  method: string;
  url: string;
  start: number;
  reqBytes?: number;
}
type TaggedXhr = XMLHttpRequest & { __tpMeta?: XhrMeta };

function bodyBytes(body: unknown): number | undefined {
  if (typeof body === "string") return body.length;
  if (body instanceof Blob) return body.size;
  if (body instanceof ArrayBuffer) return body.byteLength;
  if (ArrayBuffer.isView(body)) return body.byteLength;
  return undefined;
}

function keyOf(url: string): string {
  try {
    const u = new URL(url, typeof location !== "undefined" ? location.href : "http://localhost/");
    return u.origin + u.pathname;
  } catch {
    return url;
  }
}

export function createNetworkCollector(
  cfg: NormalizedNetworkCapture,
  opts: NetworkCollectorOptions,
): NetworkCollector {
  const buffer = createRingBuffer<NetworkEntry>({ limit: cfg.limit });
  const selfKey = opts.selfUrl ? keyOf(opts.selfUrl) : null;

  function excluded(rawUrl: string): boolean {
    if (selfKey && keyOf(rawUrl) === selfKey) return true;
    return cfg.denyUrls.some((d) => (typeof d === "string" ? rawUrl.includes(d) : d.test(rawUrl)));
  }

  function record(rawUrl: string, entry: Omit<NetworkEntry, "url">): void {
    if (excluded(rawUrl)) return;
    buffer.push({ ...entry, url: cleanUrl(rawUrl, opts.urlParams) });
  }

  // ---- fetch -------------------------------------------------------------
  const realFetch: FetchFn = window.fetch;
  const fetchWrapper: FetchFn = (input, init) => {
    const req = input as RequestInfo & { url?: string; method?: string };
    const rawUrl =
      typeof input === "string" ? input : input instanceof URL ? input.href : (req.url ?? "");
    const method = (init?.method ?? req.method ?? "GET").toUpperCase();
    const reqBytes = bodyBytes(init?.body);
    const start = performance.now();

    return realFetch(input, init).then(
      (res) => {
        const len = Number(res.headers.get("content-length"));
        record(rawUrl, {
          method,
          status: res.status,
          durationMs: Math.round(performance.now() - start),
          reqBytes,
          resBytes: Number.isFinite(len) && len > 0 ? len : undefined,
          ts: Math.round(start),
        });
        return res;
      },
      (err: unknown) => {
        record(rawUrl, {
          method,
          status: null,
          durationMs: Math.round(performance.now() - start),
          reqBytes,
          ts: Math.round(start),
          failed: true,
        });
        throw err;
      },
    );
  };
  window.fetch = fetchWrapper;

  // ---- XMLHttpRequest --------------------------------------------------
  const proto = XMLHttpRequest.prototype;
  const realOpen: XhrOpen = proto.open;
  const realSend: XhrSend = proto.send;

  const openWrapper = function (
    this: TaggedXhr,
    method: string,
    url: string | URL,
    ...rest: unknown[]
  ): void {
    this.__tpMeta = { method: String(method).toUpperCase(), url: String(url), start: 0 };
    (realOpen as (...a: unknown[]) => void).apply(this, [method, url, ...rest]);
  };

  const sendWrapper = function (
    this: TaggedXhr,
    body?: Document | XMLHttpRequestBodyInit | null,
  ): void {
    const meta = this.__tpMeta;
    if (meta) {
      meta.start = performance.now();
      meta.reqBytes = bodyBytes(body);
      this.addEventListener("loadend", () => {
        const failed = this.status === 0;
        const len = Number(this.getResponseHeader("content-length"));
        record(meta.url, {
          method: meta.method,
          status: failed ? null : this.status,
          durationMs: Math.round(performance.now() - meta.start),
          reqBytes: meta.reqBytes,
          resBytes: Number.isFinite(len) && len > 0 ? len : undefined,
          ts: Math.round(meta.start),
          failed: failed || undefined,
        });
      });
    }
    (realSend as (...a: unknown[]) => void).apply(this, [body]);
  };

  proto.open = openWrapper as XhrOpen;
  proto.send = sendWrapper as XhrSend;

  return {
    snapshot: () => buffer.toArray(),
    destroy() {
      if (window.fetch === fetchWrapper) window.fetch = realFetch;
      if (proto.open === (openWrapper as XhrOpen)) proto.open = realOpen;
      if (proto.send === (sendWrapper as XhrSend)) proto.send = realSend;
      buffer.clear();
    },
  };
}
