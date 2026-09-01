/**
 * Public type contract for @tracepoint-dev/core.
 *
 * The shapes here are the frozen Phase 1 API (PROJECT_CONTEXT.md §10, ADR 0001/0002).
 */

// ---------------------------------------------------------------- captured shapes

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

export type SelectorConfidence = "semantic" | "positional";

/**
 * Component / source info for the picked element, contributed by a framework
 * adapter (see {@link registerDescriptorContributor}). `null` when no adapter
 * matched — distinct from "looked, found nothing".
 */
export interface DescriptorComponentInfo {
  /** `displayName`, else a non-trivial function/class `.name`, else `null`. */
  name: string | null;
  /** Nearest → farthest named component ancestors. Capped. */
  stack: string[];
  /** Best-effort source location. Usually only present in dev builds. */
  source: { file: string; line: number } | null;
}

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
  /** Form-field value, or `null` for non-fields and sensitive fields. */
  value: string | null;
  text: string;
  ariaRole: string | null;
  accessibleName: string | null;
  interactiveAncestor: { selector: string; tag: string; role: string | null } | null;
  boundingRect: Rect;
  ancestors: string[];
  outerHtml: string;
  /** Filled by a framework adapter's contributor; `null` otherwise. */
  component: DescriptorComponentInfo | null;
}

export interface Screenshot {
  mimeType: string;
  dataUrl: string;
  width: number;
  height: number;
}

/** Outcome of one submit. `status` is the HTTP status when there was a response. */
export interface SubmitResult {
  ok: boolean;
  status?: number;
  error?: string;
}

// ---------------------------------------------------------------- config

export interface ThemeConfig {
  accent?: string;
  radius?: string;
  font?: string;
  colorScheme?: "light" | "dark" | "auto";
}

export interface ButtonConfig {
  /** SVG markup (starts with `<`) or an image URL. `false` for no icon. */
  icon?: string | false;
  /** `""` forces icon-only. */
  label?: string;
  variant?: "pill" | "icon";
}

/** Panel copy. Any subset may be overridden. */
export interface Labels {
  title: string;
  placeholder: string;
  submit: string;
  cancel: string;
  retry: string;
  close: string;
  success: string;
}

// ---------------------------------------------------------------- capture (Phase 2)

export type ConsoleLevel = "log" | "info" | "warn" | "error" | "debug";

/** Opt-in console + uncaught-error capture. `true` uses every default. */
export interface ConsoleCaptureConfig {
  /** Levels to keep. Default: all of them. */
  levels?: ConsoleLevel[];
  /** Max entries retained (drop-oldest). Default 50. */
  limit?: number;
  /** Max serialized bytes per entry before it is clipped. Default 4096. */
  maxEntryBytes?: number;
}

/** Opt-in network capture. Metadata only — never bodies or headers. */
export interface NetworkCaptureConfig {
  /** Max entries retained (drop-oldest). Default 50. */
  limit?: number;
  /** URLs matching any of these are never recorded. */
  denyUrls?: (string | RegExp)[];
}

/**
 * Redaction config. The bare `string[]` form is still accepted and is treated as
 * `{ selectors }`.
 */
export interface RedactConfig {
  /** CSS selectors whose matched elements are blanked in screenshots + descriptor text. */
  selectors?: string[];
  /** Applied to captured console args and app-context string values. */
  text?: (value: string) => string;
  /** Extra query-string keys to scrub from captured URLs (added to the built-in list). */
  urlParams?: string[];
  /** Enable the built-in PII pattern preset (email / card / token / phone). */
  pii?: boolean;
}

export interface UiConfig {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  theme?: ThemeConfig;
  /** `false` renders no button. */
  button?: false | ButtonConfig;
  /** CSS selector of your own element; clicking it opens the reporter. */
  trigger?: string;
  /** SVG-markup overrides for individual panel icons. */
  icons?: { close?: string };
  labels?: Partial<Labels>;
}

export interface TracepointConfig {
  /** URL the finished report is POSTed to. The only required field. */
  webhook: string;
  env?: string;
  release?: string;
  /**
   * Extra key/values sent with every report. An object is used as-is; a function
   * is called at submit time so values stay fresh.
   */
  context?: Record<string, unknown> | (() => Record<string, unknown>);
  /** CSS selectors to blank in screenshots, or a full {@link RedactConfig}. */
  redact?: string[] | RedactConfig;
  /** Opt in to console + uncaught-error capture. Off by default. */
  console?: boolean | ConsoleCaptureConfig;
  /** Opt in to network (fetch + XHR) metadata capture. Off by default. */
  network?: boolean | NetworkCaptureConfig;
  /** Omit for the default UI · `false` for headless · an object to customize. */
  ui?: false | UiConfig;
}

// ---------------------------------------------------------------- handle

export interface SendInput {
  description: string;
  target?: DescriptorBundle | null;
  screenshot?: Screenshot | null;
  annotations?: Annotation[];
}

export interface TracepointHandle {
  /** Open the built-in reporter. Warns + no-ops when `ui: false`. */
  open(): void;
  /** Close the reporter without submitting. */
  close(): void;
  /** Merge more key/values into the context sent with future reports. */
  setContext(context: Record<string, unknown>): void;
  /** Tear everything down and unbind listeners. */
  destroy(): void;

  /** Enter element-pick mode; resolves with the descriptor, or `null` if cancelled. */
  pick(): Promise<DescriptorBundle | null>;
  /** Capture a screenshot with redaction applied. `null` on failure. */
  screenshot(opts?: { fullPage?: boolean }): Promise<Screenshot | null>;
  /** Assemble the report envelope and submit it. */
  send(input: SendInput): Promise<SubmitResult>;
}
