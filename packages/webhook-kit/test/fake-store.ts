import type { ListOptions, ReportSummary, SaveInput, Store, StoredReport } from "../src/types.js";

interface Row {
  report: StoredReport;
  bytes: Uint8Array | null;
}

type FakeStore = Store & { rows: Map<string, Row>; initCalls: number };

/** In-memory Store for tests. */
export function fakeStore(): FakeStore {
  const rows = new Map<string, Row>();
  let seq = 0;

  const store: FakeStore = {
    rows,
    initCalls: 0,
    async init() {
      store.initCalls++;
    },
    async save({ payload, screenshot }: SaveInput) {
      const id = `r${++seq}`;
      const now = new Date().toISOString();
      rows.set(id, {
        report: {
          id,
          createdAt: (payload.createdAt as string) ?? now,
          receivedAt: now,
          status: "pending",
          payload,
          screenshot: screenshot
            ? { mimeType: screenshot.mimeType, width: screenshot.width, height: screenshot.height }
            : null,
        },
        bytes: screenshot?.bytes ?? null,
      });
      return { id };
    },
    async list(opts?: ListOptions) {
      let items = [...rows.values()].map(({ report }) => report);
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      if (opts?.since) items = items.filter((r) => new Date(r.createdAt) >= opts.since!);
      if (opts?.status) items = items.filter((r) => r.status === opts.status);
      if (opts?.limit) items = items.slice(0, opts.limit);
      return items.map(summaryOf);
    },
    async get(id: string) {
      return rows.get(id)?.report ?? null;
    },
    async setStatus(id: string, status) {
      const row = rows.get(id);
      if (row) row.report.status = status;
    },
    async readScreenshot(id: string) {
      const row = rows.get(id);
      if (!row?.bytes || !row.report.screenshot) return null;
      return { mimeType: row.report.screenshot.mimeType, bytes: row.bytes };
    },
    async delete(id: string) {
      rows.delete(id);
    },
    async clear(opts?: { before?: Date }) {
      let removed = 0;
      for (const [id, row] of rows) {
        if (!opts?.before || new Date(row.report.createdAt) < opts.before) {
          rows.delete(id);
          removed++;
        }
      }
      return removed;
    },
  };

  return store;
}

function summaryOf(r: StoredReport): ReportSummary {
  const report = (r.payload.report ?? {}) as { description?: string };
  const page = (r.payload.page ?? {}) as { route?: string | null };
  return {
    id: r.id,
    createdAt: r.createdAt,
    status: r.status,
    description: report.description ?? "",
    route: page.route ?? null,
    hasScreenshot: r.screenshot != null,
  };
}
