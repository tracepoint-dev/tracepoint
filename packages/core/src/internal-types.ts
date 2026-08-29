/**
 * Internal shapes — not part of the public API. The public contract is in `types.ts`.
 * The payload shapes here mirror the frozen envelope (PROJECT_CONTEXT.md §10 / ADR 0001).
 */

/** Config after validation + defaults are applied. Frozen. */
export interface NormalizedConfig {
  /** `null` means no webhook was given — the console transport is used. */
  webhook: string | null;
  env: string | null;
  release: string | null;
  context: Record<string, unknown>;
  button: boolean;
  redact: string[];
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectionRectAnnotation {
  type: "selection-rect";
  rect: Rect;
}

export type Annotation = SelectionRectAnnotation;

/** Confidence in the generated CSS selector. */
export type SelectorConfidence = "semantic" | "positional";

/** Everything captured about the picked element. */
export interface DescriptorBundle {
  primarySelector: string;
  generatedSelector: string;
  selectorConfidence: SelectorConfidence;
  selectorResolves: boolean;
  selectorMatchCount: number;
  xpath: string;
  testId: string | null;
  id: string | null;
  tag: string;
  attributes: Record<string, string>;
  text: string;
  ariaRole: string | null;
  accessibleName: string | null;
  /** Nearest [role] / button / a / [tabindex] ancestor, if the picked node was a wrapper. */
  interactiveAncestor: { selector: string; tag: string; role: string | null } | null;
  boundingRect: Rect;
  ancestors: string[];
  outerHtml: string;
}

export interface Screenshot {
  mimeType: string;
  dataUrl: string;
  width: number;
  height: number;
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
