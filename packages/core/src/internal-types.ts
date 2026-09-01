/**
 * Internal shapes — not part of the public API. Public shapes live in `types.ts`.
 */
import type { Annotation, ConsoleLevel, DescriptorBundle, Screenshot } from "./types.js";

export type Position = "bottom-right" | "bottom-left" | "top-right" | "top-left";
export type ColorScheme = "light" | "dark" | "auto";

// ---------------------------------------------------------------- capture (Phase 2)

/** Normalized `console` capture config, or `null` when not opted in. */
export interface NormalizedConsoleCapture {
  levels: ConsoleLevel[];
  limit: number;
  maxEntryBytes: number;
  totalBytes: number;
}

/** Normalized `network` capture config, or `null` when not opted in. */
export interface NormalizedNetworkCapture {
  limit: number;
  denyUrls: (string | RegExp)[];
}

export interface ConsoleEntry {
  level: ConsoleLevel;
  message: string;
  /** ms since `performance.timeOrigin`. */
  ts: number;
  /** present + >1 when consecutive identical lines were collapsed. */
  count?: number;
}

export interface ErrorEntry {
  name: string;
  message: string;
  stack: string;
  ts: number;
  kind: "error" | "rejection";
}

export interface NetworkEntry {
  method: string;
  url: string;
  status: number | null;
  durationMs: number;
  reqBytes?: number;
  resBytes?: number;
  ts: number;
  failed?: boolean;
}

export interface CaptureMeta {
  console: boolean;
  network: boolean;
  truncated: { console?: number; network?: number };
}

/** What `collectors.snapshot()` hands to `assemblePayload` at submit time. */
export interface CollectorSnapshot {
  console: ConsoleEntry[];
  errors: ErrorEntry[];
  network: NetworkEntry[];
  enabled: { console: boolean; network: boolean };
}

/** UI config after defaults are filled in. */
export interface NormalizedUi {
  position: Position;
  theme: {
    accent: string | null;
    radius: string | null;
    font: string | null;
    colorScheme: ColorScheme;
  };
  /** `null` = render no button. */
  button: { icon: string | null; label: string; variant: "pill" | "icon" } | null;
  trigger: string | null;
  icons: { close: string | null };
  labels: {
    title: string;
    placeholder: string;
    submit: string;
    cancel: string;
    retry: string;
    close: string;
    success: string;
  };
}

/** Config after validation + defaults. Frozen. */
export interface NormalizedConfig {
  webhook: string | null;
  env: string | null;
  release: string | null;
  /** Static context seed (object form). Empty when a function form is used. */
  context: Record<string, unknown>;
  /** Function form of `context`, evaluated at submit. `null` when object form. */
  contextFn: (() => Record<string, unknown>) | null;
  /** DOM selectors to blank before a screenshot (the `redact` / `redact.selectors` form). */
  redact: string[];
  /** `redact.text` — transform applied to captured strings. */
  redactText: ((value: string) => string) | null;
  /** Built-in sensitive query keys merged with `redact.urlParams`, lower-cased. */
  redactUrlParams: string[];
  /** `redact.pii` — enable the built-in PII pattern preset. */
  redactPii: boolean;
  /** `null` unless `console` capture is opted in. */
  console: NormalizedConsoleCapture | null;
  /** `null` unless `network` capture is opted in. */
  network: NormalizedNetworkCapture | null;
  /** `true` when `ui: false` — no built-in DOM. */
  headless: boolean;
  ui: NormalizedUi;
}

export interface ClientEnv {
  userAgent: string;
  viewport: { width: number; height: number; dpr: number };
  screen: { width: number; height: number };
  language: string;
  timezone: string;
}

/** The report payload POSTed to the transport. */
export interface Payload {
  tracepoint: { schemaVersion: string; sdkVersion: string };
  id: string;
  createdAt: string;
  report: { description: string; annotations: Annotation[] };
  target: DescriptorBundle | null;
  page: { url: string; route: string | null; title: string; referrer: string | null };
  screenshot: Screenshot | null;
  client: ClientEnv;
  context: Record<string, unknown>;
  /** Console history (Phase 2). `[]` unless `console` capture is opted in. */
  console: ConsoleEntry[];
  /** Uncaught errors + unhandled rejections (Phase 2). `[]` unless opted in. */
  errors: ErrorEntry[];
  /** Network activity metadata (Phase 2). `[]` unless `network` capture is opted in. */
  network: NetworkEntry[];
  /** What was collected + what got trimmed, so a consumer knows what to trust. */
  capture: CaptureMeta;
}

/** Mutable work-in-progress a report is built from before submit. */
export interface Draft {
  description: string;
  target: DescriptorBundle | null;
  screenshot: Screenshot | null;
  annotations: Annotation[];
}
