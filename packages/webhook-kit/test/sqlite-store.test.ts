import { beforeEach, describe, expect, it } from "vitest";
import { openSqlite } from "../src/internal/sqlite-driver.js";
import { sqliteStore } from "../src/stores/index.js";
import type { Store } from "../src/types.js";

let store: Store;

beforeEach(async () => {
  store = sqliteStore({ file: ":memory:" });
  await store.init();
});

function input(description: string, createdAt: string, route = "/x", withShot = true) {
  return {
    payload: {
      createdAt,
      report: { description, annotations: [] },
      page: { url: `https://a.test${route}`, route },
    },
    screenshot: withShot
      ? { mimeType: "image/png", width: 4, height: 2, bytes: new TextEncoder().encode("PNG") }
      : null,
  };
}

describe("sqliteStore", () => {
  it("saves, gets, lists newest-first, round-trips the screenshot", async () => {
    const a = await store.save(input("first", "2026-08-30T00:00:00.000Z"));
    const b = await store.save(input("second", "2026-08-30T00:05:00.000Z"));

    const list = await store.list();
    expect(list.map((r) => r.id)).toEqual([b.id, a.id]);

    const full = await store.get(a.id);
    expect(full?.payload.report).toMatchObject({ description: "first" });
    expect(full?.screenshot).toEqual({ mimeType: "image/png", width: 4, height: 2 });

    const shot = await store.readScreenshot(a.id);
    expect(new TextDecoder().decode(shot?.bytes)).toBe("PNG");
  });

  it("advertises and applies search + route filters", async () => {
    expect(store.capabilities).toEqual({ search: true, routeFilter: true });
    await store.save(input("checkout is broken", "2026-08-30T00:00:00.000Z", "/checkout"));
    await store.save(input("login is broken", "2026-08-30T00:01:00.000Z", "/login"));

    expect((await store.list({ route: "/login" })).map((r) => r.description)).toEqual([
      "login is broken",
    ]);
    expect((await store.list({ search: "checkout" })).map((r) => r.description)).toEqual([
      "checkout is broken",
    ]);
  });

  it("limit and since", async () => {
    await store.save(input("old", "2026-08-01T00:00:00.000Z"));
    await store.save(input("new", "2026-08-30T00:00:00.000Z"));
    expect((await store.list({ limit: 1 })).length).toBe(1);
    expect(
      (await store.list({ since: new Date("2026-08-15T00:00:00.000Z") })).map((r) => r.description),
    ).toEqual(["new"]);
  });

  it("delete removes the row and its screenshot", async () => {
    const { id } = await store.save(input("x", "2026-08-30T00:00:00.000Z"));
    await store.delete(id);
    expect(await store.get(id)).toBeNull();
    expect(await store.readScreenshot(id)).toBeNull();
  });

  it("clear({ before }) and clear() all", async () => {
    await store.save(input("old", "2026-08-01T00:00:00.000Z"));
    await store.save(input("new", "2026-08-30T00:00:00.000Z"));
    expect(await store.clear({ before: new Date("2026-08-15T00:00:00.000Z") })).toBe(1);
    expect(await store.clear()).toBe(1);
    expect((await store.list()).length).toBe(0);
  });

  it("new reports are pending; setStatus flips them; list filters by status", async () => {
    const a = await store.save(input("a", "2026-08-30T00:00:00.000Z"));
    const b = await store.save(input("b", "2026-08-30T00:05:00.000Z"));

    expect((await store.get(a.id))?.status).toBe("pending");
    expect((await store.list())[0]?.status).toBe("pending");

    await store.setStatus(a.id, "approved");
    expect((await store.get(a.id))?.status).toBe("approved");
    expect((await store.list({ status: "approved" })).map((r) => r.id)).toEqual([a.id]);
    expect((await store.list({ status: "pending" })).map((r) => r.id)).toEqual([b.id]);

    await store.setStatus("no-such-id", "approved"); // no-op, must not throw
  });

  it("migrates a status column onto a table created before the field existed", async () => {
    // The sqliteStore under test keeps its connection open (no close() in the
    // Store interface), so on Windows the temp file can't be unlinked afterwards.
    // A lingering file in the OS temp dir is fine for a test.
    const { mkdtemp } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const dir = await mkdtemp(join(tmpdir(), "tp-sqlite-migrate-"));
    const file = join(dir, "old.db");

    const raw = await openSqlite(file);
    raw.exec(`CREATE TABLE reports (
      id TEXT PRIMARY KEY, created_at TEXT NOT NULL, received_at TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '', route TEXT, payload TEXT NOT NULL,
      shot_mime TEXT, shot_w INTEGER, shot_h INTEGER)`);
    raw
      .prepare(
        "INSERT INTO reports (id, created_at, received_at, description, payload) VALUES (?, ?, ?, ?, ?)",
      )
      .run("old1", "2026-08-01T00:00:00.000Z", "2026-08-01T00:00:00.000Z", "legacy", "{}");
    raw.close();

    const migrated = sqliteStore({ file });
    await migrated.init();
    expect((await migrated.get("old1"))?.status).toBe("pending");
    await migrated.setStatus("old1", "approved");
    expect((await migrated.list({ status: "approved" })).map((r) => r.id)).toEqual(["old1"]);
  });
});
