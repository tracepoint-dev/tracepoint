import type { Receiver, ReceiverOptions, Store } from "../types.js";
import { type DashboardCtx, handleDashboard } from "./routes.js";

export { handleDashboard, type DashboardCtx } from "./routes.js";

export interface DashboardOptions {
  store: Store;
  basePath?: string;
  auth?: ReceiverOptions["auth"];
}

/**
 * Mount the dashboard on its own, against any store — e.g. to browse reports that
 * are already in a database without running the full receiver.
 */
export function createDashboard(opts: DashboardOptions): Receiver {
  const base = (opts.basePath ?? "/tracepoint").replace(/\/$/, "");
  const ctx: DashboardCtx = { store: opts.store, base, auth: opts.auth };
  let ready: Promise<void> | null = null;

  return {
    async handleRequest(request) {
      const url = new URL(request.url);
      const rel = url.pathname.startsWith(base) ? url.pathname.slice(base.length) || "/" : null;
      if (rel === null) return new Response(null, { status: 404 });

      if (!ready) ready = opts.store.init();
      await ready;

      const res = await handleDashboard(ctx, request.method, rel, request);
      return res ?? new Response(null, { status: 404 });
    },
  };
}
