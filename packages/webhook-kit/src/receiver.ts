import { type DashboardCtx, handleDashboard } from "./dashboard/routes.js";
import { parseDuration } from "./internal/duration.js";
import { extractScreenshot } from "./internal/screenshot.js";
import type { Handler, HandlerCtx, Receiver, ReceiverOptions, StoredReport } from "./types.js";

const DEFAULT_BASE = "/tracepoint";

const logger: HandlerCtx["logger"] = {
  info: (m) => console.info(`[webhook-kit] ${m}`),
  error: (m, e) => console.error(`[webhook-kit] ${m}`, e ?? ""),
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function createReceiver(opts: ReceiverOptions): Receiver {
  const base = (opts.basePath ?? DEFAULT_BASE).replace(/\/$/, "");
  const maxAgeMs = opts.retention?.maxAge ? parseDuration(opts.retention.maxAge) : null;
  const maxCount = opts.retention?.maxCount ?? null;
  const chain: Handler[] = opts.handlers ?? [];
  const dashboard: DashboardCtx | null = opts.dashboard
    ? { store: opts.store, base, auth: opts.auth }
    : null;

  let ready: Promise<void> | null = null;
  function ensureReady(): Promise<void> {
    if (!ready) ready = opts.store.init();
    return ready;
  }

  // Lazy: `./mcp` (and `@modelcontextprotocol/sdk`) load only on the first /mcp hit.
  let mcp: ((request: Request) => Promise<Response>) | null = null;
  async function mcpFor(request: Request): Promise<Response> {
    if (opts.auth && !(await opts.auth(request))) {
      return new Response("unauthorized", { status: 401 });
    }
    if (!mcp) {
      const mod = await import("./mcp/index.js");
      mcp = mod.mcpHandler(opts.store);
    }
    return mcp(request);
  }

  async function runChain(report: StoredReport): Promise<void> {
    const ctx = {
      logger,
      readScreenshot: () => opts.store.readScreenshot(report.id),
    };
    for (const handler of chain) {
      try {
        await handler(report, ctx);
      } catch (err) {
        logger.error(`chain handler failed for report ${report.id}`, err);
      }
    }
  }

  async function prune(): Promise<void> {
    if (maxAgeMs != null) {
      await opts.store.clear({ before: new Date(Date.now() - maxAgeMs) });
    }
    if (maxCount != null) {
      const rows = await opts.store.list({ limit: maxCount + 500 });
      for (const row of rows.slice(maxCount)) await opts.store.delete(row.id);
    }
  }

  async function ingest(request: Request): Promise<Response> {
    let envelope: Record<string, unknown>;
    try {
      envelope = (await request.json()) as Record<string, unknown>;
    } catch {
      return json({ ok: false, error: "invalid JSON body" }, 400);
    }

    const { payload, screenshot } = extractScreenshot(envelope);
    const { id } = await opts.store.save({ payload, screenshot });

    const stored = await opts.store.get(id);
    if (stored) {
      void runChain(stored)
        .then(() => prune())
        .catch((err) => logger.error("post-save tasks failed", err));
    }

    return json({ ok: true, id }, 201);
  }

  return {
    async handleRequest(request) {
      const url = new URL(request.url);
      const rel = url.pathname.startsWith(base) ? url.pathname.slice(base.length) || "/" : null;
      if (rel === null) return json({ ok: false, error: "not found" }, 404);

      await ensureReady();

      if (request.method === "POST" && rel === "/ingest") return ingest(request);

      if (opts.mcp && rel === "/mcp") return mcpFor(request);

      if (dashboard) {
        const res = await handleDashboard(dashboard, request.method, rel, request);
        if (res) return res;
      }

      return json({ ok: false, error: "not found" }, 404);
    },
  };
}
