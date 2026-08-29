/** A lexically-sortable id: ISO timestamp (path-safe) + a short random suffix. */
export function makeId(createdAt: string): string {
  const t = new Date(createdAt);
  const stamp = (Number.isNaN(t.getTime()) ? new Date() : t)
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("Z", "");
  const rand = Math.random().toString(36).slice(2, 8);
  return `${stamp}__${rand}`;
}

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MIME = Object.fromEntries(Object.entries(EXT).map(([m, e]) => [e, m]));

export const extFor = (mimeType: string): string => EXT[mimeType] ?? "bin";
export const mimeForExt = (ext: string): string => MIME[ext] ?? "application/octet-stream";

/** Summary fields pulled from a stored envelope. */
export function summarize(payload: Record<string, unknown>) {
  const report = (payload.report ?? {}) as { description?: string };
  const page = (payload.page ?? {}) as { route?: string | null };
  return { description: report.description ?? "", route: page.route ?? null };
}
