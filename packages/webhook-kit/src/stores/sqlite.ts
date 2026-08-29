import { type Db, openSqlite } from "../internal/sqlite-driver.js";
import type { ListOptions, Store, StoredReport } from "../types.js";
import { makeId, summarize } from "./ids.js";

export interface SqliteStoreOptions {
  /** DB file path, or `":memory:"`. */
  file: string;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS reports (
  id          TEXT PRIMARY KEY,
  created_at  TEXT NOT NULL,
  received_at TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  route       TEXT,
  payload     TEXT NOT NULL,
  shot_mime   TEXT,
  shot_w      INTEGER,
  shot_h      INTEGER
);
CREATE TABLE IF NOT EXISTS screenshots (
  id    TEXT PRIMARY KEY,
  mime  TEXT NOT NULL,
  bytes BLOB NOT NULL
);
CREATE INDEX IF NOT EXISTS reports_created_at ON reports (created_at DESC);
`;

interface ReportRow {
  id: string;
  created_at: string;
  received_at: string;
  payload: string;
  shot_mime: string | null;
  shot_w: number | null;
  shot_h: number | null;
}

function toStoredReport(row: ReportRow): StoredReport {
  return {
    id: row.id,
    createdAt: row.created_at,
    receivedAt: row.received_at,
    payload: JSON.parse(row.payload) as Record<string, unknown>,
    screenshot: row.shot_mime
      ? { mimeType: row.shot_mime, width: row.shot_w ?? 0, height: row.shot_h ?? 0 }
      : null,
  };
}

/** Persistent store with real filtering/search. Needs `better-sqlite3` or Node ≥ 22.5. */
export function sqliteStore(opts: SqliteStoreOptions): Store {
  let db: Db | null = null;
  const need = (): Db => {
    if (!db) throw new Error("sqliteStore.init() has not run");
    return db;
  };

  return {
    async init() {
      db = await openSqlite(opts.file);
      db.exec(SCHEMA);
    },

    async save({ payload, screenshot }) {
      const d = need();
      const createdAt = (payload.createdAt as string) ?? new Date().toISOString();
      const id = makeId(createdAt);
      const { description, route } = summarize(payload);

      d.prepare(
        `INSERT INTO reports
           (id, created_at, received_at, description, route, payload, shot_mime, shot_w, shot_h)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        createdAt,
        new Date().toISOString(),
        description,
        route,
        JSON.stringify(payload),
        screenshot?.mimeType ?? null,
        screenshot?.width ?? null,
        screenshot?.height ?? null,
      );

      if (screenshot) {
        d.prepare("INSERT INTO screenshots (id, mime, bytes) VALUES (?, ?, ?)").run(
          id,
          screenshot.mimeType,
          Buffer.from(screenshot.bytes),
        );
      }
      return { id };
    },

    async list(opts: ListOptions = {}) {
      const where: string[] = [];
      const params: unknown[] = [];
      if (opts.since) {
        where.push("created_at >= ?");
        params.push(opts.since.toISOString());
      }
      if (opts.route) {
        where.push("route = ?");
        params.push(opts.route);
      }
      if (opts.search) {
        where.push("description LIKE ?");
        params.push(`%${opts.search}%`);
      }
      const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const limit = opts.limit ?? 200;

      const rows = need()
        .prepare(
          `SELECT id, created_at, description, route, shot_mime
             FROM reports ${clause}
             ORDER BY created_at DESC LIMIT ?`,
        )
        .all(...params, limit) as Array<{
        id: string;
        created_at: string;
        description: string;
        route: string | null;
        shot_mime: string | null;
      }>;

      return rows.map((r) => ({
        id: r.id,
        createdAt: r.created_at,
        description: r.description,
        route: r.route,
        hasScreenshot: r.shot_mime != null,
      }));
    },

    async get(id) {
      const row = need().prepare("SELECT * FROM reports WHERE id = ?").get(id) as
        | ReportRow
        | undefined;
      return row ? toStoredReport(row) : null;
    },

    async readScreenshot(id) {
      const row = need().prepare("SELECT mime, bytes FROM screenshots WHERE id = ?").get(id) as
        | { mime: string; bytes: Uint8Array }
        | undefined;
      return row ? { mimeType: row.mime, bytes: new Uint8Array(row.bytes) } : null;
    },

    async delete(id) {
      need().prepare("DELETE FROM reports WHERE id = ?").run(id);
      need().prepare("DELETE FROM screenshots WHERE id = ?").run(id);
    },

    async clear(opts = {}) {
      const d = need();
      if (opts.before) {
        const iso = opts.before.toISOString();
        const ids = (
          d.prepare("SELECT id FROM reports WHERE created_at < ?").all(iso) as Array<{ id: string }>
        ).map((r) => r.id);
        for (const id of ids) await this.delete(id);
        return ids.length;
      }
      const n = (d.prepare("SELECT COUNT(*) AS n FROM reports").get() as { n: number }).n;
      d.exec("DELETE FROM reports; DELETE FROM screenshots;");
      return n;
    },

    capabilities: { search: true, routeFilter: true },
  };
}
