import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ListOptions, Store, StoredReport } from "../types.js";
import { extFor, makeId, mimeForExt, summarize } from "./ids.js";

export interface JsonFileStoreOptions {
  /** Directory the store owns. Reports go in `<dir>/reports/`. */
  dir: string;
}

/**
 * Zero-dependency store: one `<id>.json` per report + a sibling `<id>.<ext>` for
 * the screenshot. Per-file delete, no locking, no corruption. Good for hundreds
 * of reports; switch to `sqliteStore` beyond that.
 */
export function jsonFileStore(opts: JsonFileStoreOptions): Store {
  const root = join(opts.dir, "reports");
  const jsonPath = (id: string) => join(root, `${id}.json`);

  async function screenshotPath(id: string): Promise<string | null> {
    for (const name of await readdir(root).catch(() => [])) {
      if (name.startsWith(`${id}.`) && !name.endsWith(".json")) return join(root, name);
    }
    return null;
  }

  async function stems(): Promise<string[]> {
    const names = await readdir(root).catch(() => []);
    return names
      .filter((n) => n.endsWith(".json"))
      .map((n) => n.slice(0, -5))
      .sort()
      .reverse(); // newest first (ids are time-sortable)
  }

  return {
    async init() {
      await mkdir(root, { recursive: true });
    },

    async save({ payload, screenshot }) {
      const createdAt = (payload.createdAt as string) ?? new Date().toISOString();
      const id = makeId(createdAt);
      const record: StoredReport = {
        id,
        createdAt,
        receivedAt: new Date().toISOString(),
        payload,
        screenshot: screenshot
          ? { mimeType: screenshot.mimeType, width: screenshot.width, height: screenshot.height }
          : null,
      };
      await writeFile(jsonPath(id), JSON.stringify(record, null, 2));
      if (screenshot) {
        await writeFile(join(root, `${id}.${extFor(screenshot.mimeType)}`), screenshot.bytes);
      }
      return { id };
    },

    async list(opts: ListOptions = {}) {
      const since = opts.since?.getTime();
      const out = [];
      for (const id of await stems()) {
        if (opts.limit && out.length >= opts.limit) break;
        const record = await this.get(id);
        if (!record) continue;
        if (since !== undefined && new Date(record.createdAt).getTime() < since) continue;
        const { description, route } = summarize(record.payload);
        out.push({
          id,
          createdAt: record.createdAt,
          description,
          route,
          hasScreenshot: record.screenshot != null,
        });
      }
      return out;
    },

    async get(id) {
      if (!existsSync(jsonPath(id))) return null;
      return JSON.parse(await readFile(jsonPath(id), "utf8")) as StoredReport;
    },

    async readScreenshot(id) {
      const path = await screenshotPath(id);
      if (!path) return null;
      const ext = path.slice(path.lastIndexOf(".") + 1);
      return { mimeType: mimeForExt(ext), bytes: await readFile(path) };
    },

    async delete(id) {
      await rm(jsonPath(id), { force: true });
      const shot = await screenshotPath(id);
      if (shot) await rm(shot, { force: true });
    },

    async clear(opts = {}) {
      const before = opts.before?.getTime();
      let removed = 0;
      for (const id of await stems()) {
        if (before !== undefined) {
          const record = await this.get(id);
          if (record && new Date(record.createdAt).getTime() >= before) continue;
        }
        await this.delete(id);
        removed++;
      }
      return removed;
    },

    capabilities: { search: false, routeFilter: false },
  };
}
