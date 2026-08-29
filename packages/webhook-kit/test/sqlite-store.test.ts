import { beforeEach, describe, expect, it } from "vitest";
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
});
