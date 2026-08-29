/**
 * A tiny common shape over the two SQLite drivers. `better-sqlite3` is tried
 * first (mature, quiet); `node:sqlite` (built into Node ≥ 22.5) is the
 * zero-install fallback. Both expose an almost identical synchronous API.
 */

export interface Stmt {
  run(...params: unknown[]): void;
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}

export interface Db {
  exec(sql: string): void;
  prepare(sql: string): Stmt;
  close(): void;
}

interface RawDb {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...p: unknown[]): unknown;
    get(...p: unknown[]): unknown;
    all(...p: unknown[]): unknown[];
  };
  close(): unknown;
}

function wrap(raw: RawDb): Db {
  return {
    exec: (sql) => void raw.exec(sql),
    prepare: (sql) => {
      const s = raw.prepare(sql);
      return {
        run: (...p) => void s.run(...p),
        get: (...p) => s.get(...p),
        all: (...p) => s.all(...p),
      };
    },
    close: () => void raw.close(),
  };
}

export async function openSqlite(file: string): Promise<Db> {
  try {
    const mod = (await import("better-sqlite3")) as { default: new (f: string) => RawDb };
    return wrap(new mod.default(file));
  } catch {
    // fall through to the built-in
  }
  try {
    const mod = (await import("node:sqlite")) as { DatabaseSync: new (f: string) => RawDb };
    return wrap(new mod.DatabaseSync(file));
  } catch {
    throw new Error(
      "sqliteStore needs a SQLite driver: install `better-sqlite3`, or run on Node >= 22.5 " +
        "for the built-in `node:sqlite`.",
    );
  }
}
