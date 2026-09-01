import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { jsonFileStore } from "../src/stores/index.js";
import type { Store } from "../src/types.js";

let dir: string;
let store: Store;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "tp-store-"));
  store = jsonFileStore({ dir });
  await store.init();
});
afterEach(() => rm(dir, { recursive: true, force: true }));

function input(description: string, createdAt: string, withShot = true) {
  return {
    payload: {
      createdAt,
      report: { description, annotations: [] },
      page: { url: "https://a.test/x", route: "/x" },
    },
    screenshot: withShot
      ? { mimeType: "image/png", width: 4, height: 2, bytes: new TextEncoder().encode("PNGDATA") }
      : null,
  };
}

describe("jsonFileStore", () => {
  it("saves, gets, and lists newest-first", async () => {
    const a = await store.save(input("first", "2026-08-30T00:00:00.000Z"));
    const b = await store.save(input("second", "2026-08-30T00:05:00.000Z"));

    const list = await store.list();
    expect(list.map((r) => r.id)).toEqual([b.id, a.id]);
    expect(list[0]).toMatchObject({ description: "second", route: "/x", hasScreenshot: true });

    const full = await store.get(a.id);
    expect(full?.payload.report).toMatchObject({ description: "first" });
    expect(full?.screenshot).toEqual({ mimeType: "image/png", width: 4, height: 2 });
  });

  it("stores the screenshot as a sibling file and reads it back", async () => {
    const { id } = await store.save(input("x", "2026-08-30T00:00:00.000Z"));
    const shot = await store.readScreenshot(id);
    expect(shot?.mimeType).toBe("image/png");
    expect(new TextDecoder().decode(shot?.bytes)).toBe("PNGDATA");
  });

  it("honours limit and since", async () => {
    await store.save(input("old", "2026-08-01T00:00:00.000Z"));
    await store.save(input("mid", "2026-08-15T00:00:00.000Z"));
    await store.save(input("new", "2026-08-30T00:00:00.000Z"));

    expect((await store.list({ limit: 2 })).length).toBe(2);
    const recent = await store.list({ since: new Date("2026-08-10T00:00:00.000Z") });
    expect(recent.map((r) => r.description)).toEqual(["new", "mid"]);
  });

  it("delete removes both files; get returns null after", async () => {
    const { id } = await store.save(input("x", "2026-08-30T00:00:00.000Z"));
    await store.delete(id);
    expect(await store.get(id)).toBeNull();
    expect(await store.readScreenshot(id)).toBeNull();
  });

  it("clear({ before }) removes only older reports", async () => {
    await store.save(input("old", "2026-08-01T00:00:00.000Z"));
    await store.save(input("new", "2026-08-30T00:00:00.000Z"));

    const removed = await store.clear({ before: new Date("2026-08-15T00:00:00.000Z") });
    expect(removed).toBe(1);
    expect((await store.list()).map((r) => r.description)).toEqual(["new"]);
  });

  it("refuses ids that try to escape the store directory", async () => {
    // a JSON file one level above the store dir — must stay unreachable
    const outside = join(dir, "outside-secret.json");
    await writeFile(outside, JSON.stringify({ token: "s3cret" }));

    for (const bad of [
      "../outside-secret",
      "..\\outside-secret",
      "../../etc/hosts",
      "a/b",
      "x.json",
    ]) {
      expect(await store.get(bad)).toBeNull();
      expect(await store.readScreenshot(bad)).toBeNull();
      await store.delete(bad); // no-op, must not throw
    }

    expect(existsSync(outside)).toBe(true);
    expect(JSON.parse(await readFile(outside, "utf8")).token).toBe("s3cret");
  });

  it("handles a report with no screenshot", async () => {
    const { id } = await store.save(input("noshot", "2026-08-30T00:00:00.000Z", false));
    expect((await store.get(id))?.screenshot).toBeNull();
    expect(await store.readScreenshot(id)).toBeNull();
    expect((await store.list())[0]?.hasScreenshot).toBe(false);
  });

  it("new reports are pending; setStatus flips them; list filters by status", async () => {
    const a = await store.save(input("a", "2026-08-30T00:00:00.000Z"));
    const b = await store.save(input("b", "2026-08-30T00:05:00.000Z"));

    expect((await store.get(a.id))?.status).toBe("pending");
    expect((await store.list())[0]?.status).toBe("pending");

    await store.setStatus(a.id, "approved");
    expect((await store.get(a.id))?.status).toBe("approved");
    // the rest of the record is intact
    expect((await store.get(a.id))?.payload.report).toMatchObject({ description: "a" });

    expect((await store.list({ status: "approved" })).map((r) => r.id)).toEqual([a.id]);
    expect((await store.list({ status: "pending" })).map((r) => r.id)).toEqual([b.id]);
    expect((await store.list()).length).toBe(2); // no filter = all

    await store.setStatus("no-such-id", "approved"); // no-op, must not throw
  });

  it("back-fills status: pending for records written before the field existed", async () => {
    const legacy = {
      id: "2026-08-30T00-00-00-000_legacy",
      createdAt: "2026-08-30T00:00:00.000Z",
      receivedAt: "2026-08-30T00:00:01.000Z",
      payload: { report: { description: "legacy", annotations: [] }, page: { route: "/x" } },
      screenshot: null,
    };
    await writeFile(join(dir, "reports", `${legacy.id}.json`), JSON.stringify(legacy));

    expect((await store.get(legacy.id))?.status).toBe("pending");
    expect((await store.list({ status: "pending" })).map((r) => r.id)).toContain(legacy.id);
  });
});
