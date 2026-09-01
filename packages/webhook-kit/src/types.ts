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

/**
 * Triage state for a report (see PROJECT_CONTEXT §12e). New reports are
 * `"pending"`; a human approves or rejects from the dashboard. The Phase 4b MCP
 * only ever exposes `"approved"` reports.
 */
export type ReportStatus = "pending" | "approved" | "rejected";

/** A report as stored. `payload` is the envelope; the screenshot is out-of-band. */
export interface StoredReport {
  id: string;
  createdAt: string;
  receivedAt: string;
  status: ReportStatus;
  payload: Record<string, unknown>;
  screenshot: { mimeType: string; width: number; height: number } | null;
}

/** Lightweight row for list views. */
export interface ReportSummary {
  id: string;
  createdAt: string;
  status: ReportStatus;
  description: string;
  route: string | null;
  hasScreenshot: boolean;
}

export interface ListOptions {
  /** Baseline — honoured by every store. */
  limit?: number;
  cursor?: string;
  since?: Date;
  /** Baseline — honoured by every store. Omit for all statuses. */
  status?: ReportStatus;
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
  /** Set a report's triage state. No-op if the id is unknown. */
  setStatus(id: string, status: ReportStatus): Promise<void>;
  readScreenshot(id: string): Promise<{ mimeType: string; bytes: Uint8Array } | null>;
  delete(id: string): Promise<void>;
  /** Delete reports (optionally only those before a date). Returns the count removed. */
  clear(opts?: { before?: Date }): Promise<number>;
  /** Which optional {@link ListOptions} filters this store honours. */
  capabilities?: { search?: boolean; routeFilter?: boolean };
}

export interface HandlerCtx {
  logger: { info(message: string): void; error(message: string, err?: unknown): void };
  /** The screenshot bytes for this report, if any. */
  readScreenshot(): Promise<{ mimeType: string; bytes: Uint8Array } | null>;
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
  /**
   * Serve a read-only MCP (Streamable HTTP) endpoint at `{basePath}/mcp` for
   * agent tools. Exposes `approved` reports only. Needs `@modelcontextprotocol/sdk`
   * + `zod` installed (optional peers). Guarded by `auth`.
   */
  mcp?: boolean;
  /** Guard for the dashboard, the MCP endpoint, and the mutation routes. Return false (or throw) to deny. */
  auth?: (request: Request) => boolean | Promise<boolean>;
  /** Mount prefix, for building links. Default `"/tracepoint"`. */
  basePath?: string;
}

export interface Receiver {
  handleRequest(request: Request): Promise<Response>;
}
