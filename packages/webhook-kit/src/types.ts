/** Public contract for @tracepoint-dev/webhook-kit. See ADR 0003. */

/** Screenshot bytes + metadata handed to a store on save. */
export interface ScreenshotInput {
  mimeType: string;
  width: number;
  height: number;
  bytes: Uint8Array;
}

export interface SaveInput {
  /** The Tracepoint envelope as POSTed by the SDK, minus the screenshot data URL. */
  payload: Record<string, unknown>;
  screenshot?: ScreenshotInput | null;
}

/** A report as stored. `payload` is the envelope; the screenshot is out-of-band. */
export interface StoredReport {
  id: string;
  createdAt: string;
  receivedAt: string;
  payload: Record<string, unknown>;
  screenshot: { mimeType: string; width: number; height: number } | null;
}

/** Lightweight row for list views. */
export interface ReportSummary {
  id: string;
  createdAt: string;
  description: string;
  route: string | null;
  hasScreenshot: boolean;
}

export interface ListOptions {
  /** Baseline — honoured by every store. */
  limit?: number;
  cursor?: string;
  since?: Date;
  /** Optional — SQL stores only (see {@link Store.capabilities}). */
  route?: string;
  search?: string;
}

export interface Store {
  /** Create dirs / tables / run migrations. Called once before first use. */
  init(): Promise<void>;
  save(input: SaveInput): Promise<{ id: string }>;
  list(opts?: ListOptions): Promise<ReportSummary[]>;
  get(id: string): Promise<StoredReport | null>;
  readScreenshot(id: string): Promise<{ mimeType: string; bytes: Uint8Array } | null>;
  delete(id: string): Promise<void>;
  /** Delete reports (optionally only those before a date). Returns the count removed. */
  clear(opts?: { before?: Date }): Promise<number>;
  /** Which optional {@link ListOptions} filters this store honours. */
  capabilities?: { search?: boolean; routeFilter?: boolean };
}

export interface HandlerCtx {
  logger: { info(message: string): void; error(message: string, err?: unknown): void };
}

/** An outbound step run after a report is saved. Failures are logged, never rethrown. */
export type Handler = (report: StoredReport, ctx: HandlerCtx) => Promise<void> | void;

export interface RetentionOptions {
  /** e.g. `"90d"`, `"12h"`, `"30m"`. */
  maxAge?: string;
  /** Keep at most this many reports (newest wins). */
  maxCount?: number;
}

export interface ReceiverOptions {
  store: Store;
  /** Outbound handlers run in order after a report is saved. */
  handlers?: Handler[];
  retention?: RetentionOptions;
  dashboard?: boolean;
  /** Guard for the dashboard + mutation routes. Return false (or throw) to deny. */
  auth?: (request: Request) => boolean | Promise<boolean>;
  /** Mount prefix, for building links. Default `"/tracepoint"`. */
  basePath?: string;
}

export interface Receiver {
  handleRequest(request: Request): Promise<Response>;
}
