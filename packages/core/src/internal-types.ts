/**
 * Internal shapes — not part of the public API. Public shapes live in `types.ts`.
 */
import type { Annotation, DescriptorBundle, Screenshot } from "./types.js";

export type Position = "bottom-right" | "bottom-left" | "top-right" | "top-left";
export type ColorScheme = "light" | "dark" | "auto";

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
  context: Record<string, unknown>;
  redact: string[];
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
}

/** Mutable work-in-progress a report is built from before submit. */
export interface Draft {
  description: string;
  target: DescriptorBundle | null;
  screenshot: Screenshot | null;
  annotations: Annotation[];
}
