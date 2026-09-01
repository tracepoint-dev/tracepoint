import type { ReceiverOptions, ReportStatus, Store } from "../types.js";
import { renderDetail, renderList } from "./view.js";

const STATUSES: readonly ReportStatus[] = ["pending", "approved", "rejected"];
const isStatus = (v: unknown): v is ReportStatus => STATUSES.includes(v as ReportStatus);

export interface DashboardCtx {
  store: Store;
  base: string;
  auth?: ReceiverOptions["auth"];
}

const html = (markup: string, status = 200) =>
  new Response(markup, { status, headers: { "content-type": "text/html; charset=utf-8" } });

const redirect = (to: string) => new Response(null, { status: 303, headers: { location: to } });

/**
 * Handle a dashboard request. Returns `null` if `rel` isn't a dashboard route,
 * so the receiver can fall through to its 404.
 */
export async function handleDashboard(
  ctx: DashboardCtx,
  method: string,
  rel: string,
  request: Request,
): Promise<Response | null> {
  const url = new URL(request.url);

  const isRoute =
    rel === "/" ||
    rel === "/clear" ||
    /^\/reports\/[^/]+$/.test(rel) ||
    /^\/reports\/[^/]+\/(screenshot|delete|status)$/.test(rel);
  if (!isRoute) return null;

  if (ctx.auth && !(await ctx.auth(request))) {
    return new Response("unauthorized", { status: 401 });
  }

  // GET /  — defaults to the pending queue; ?status=approved|rejected|all
  if (method === "GET" && rel === "/") {
    const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 500);
    const q = url.searchParams.get("q") ?? undefined;
    const route = url.searchParams.get("route") ?? undefined;
    const statusParam = url.searchParams.get("status") ?? "pending";
    const filter =
      statusParam === "all" ? undefined : isStatus(statusParam) ? statusParam : "pending";
    const rows = await ctx.store.list({ limit, search: q, route, status: filter });
    return html(
      renderList(
        ctx.base,
        rows,
        limit,
        { q, route, status: statusParam },
        ctx.store.capabilities ?? {},
      ),
    );
  }

  // GET /reports/:id
  const detail = /^\/reports\/([^/]+)$/.exec(rel);
  if (method === "GET" && detail) {
    const report = await ctx.store.get(decodeURIComponent(detail[1] as string));
    if (!report) return html("<p>Not found</p>", 404);
    return html(renderDetail(ctx.base, report));
  }

  // GET /reports/:id/screenshot
  const shot = /^\/reports\/([^/]+)\/screenshot$/.exec(rel);
  if (method === "GET" && shot) {
    const file = await ctx.store.readScreenshot(decodeURIComponent(shot[1] as string));
    if (!file) return new Response(null, { status: 404 });
    return new Response(file.bytes, {
      headers: { "content-type": file.mimeType, "cache-control": "private, max-age=3600" },
    });
  }

  // POST /reports/:id/status  — body: status=approved|rejected|pending
  const setStatus = /^\/reports\/([^/]+)\/status$/.exec(rel);
  if (method === "POST" && setStatus) {
    const id = decodeURIComponent(setStatus[1] as string);
    const next = (await request.formData().catch(() => null))?.get("status");
    if (!isStatus(next)) return html("<p>Invalid status</p>", 400);
    await ctx.store.setStatus(id, next);
    return redirect(`${ctx.base}/reports/${encodeURIComponent(id)}`);
  }

  // POST /reports/:id/delete
  const del = /^\/reports\/([^/]+)\/delete$/.exec(rel);
  if (method === "POST" && del) {
    await ctx.store.delete(decodeURIComponent(del[1] as string));
    return redirect(ctx.base || "/");
  }

  // POST /clear
  if (method === "POST" && rel === "/clear") {
    const before = url.searchParams.get("before");
    await ctx.store.clear(before ? { before: new Date(before) } : undefined);
    return redirect(ctx.base || "/");
  }

  return html("<p>Method not allowed</p>", 405);
}
