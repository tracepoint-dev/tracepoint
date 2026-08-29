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
  context?: Record<string, unknown>;
  /** CSS selectors whose matched elements are blanked in screenshots. */
  redact?: string[];
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
