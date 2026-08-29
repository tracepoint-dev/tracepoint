# @tracepoint-dev/webhook-kit

The receiver side of [Tracepoint](../../README.md) — a library you mount **inside your own
backend** (not a hosted service). It stores incoming reports, serves a dashboard, and can
fan out to other tools.

```ts
import { createReceiver } from "@tracepoint-dev/webhook-kit";
import { jsonFileStore } from "@tracepoint-dev/webhook-kit/stores";
import { discord } from "@tracepoint-dev/webhook-kit/connectors";

const receiver = createReceiver({
  store: jsonFileStore({ dir: ".tracepoint" }),   // zero-dependency default
  handlers: [discord(process.env.DISCORD_HOOK)],   // optional outbound chain
  retention: { maxAge: "90d", maxCount: 2000 },
  dashboard: true,
});

// framework-agnostic:
const res = await receiver.handleRequest(request); // Web Fetch Request -> Response

// or with Express glue:
import { mount } from "@tracepoint-dev/webhook-kit/express";
app.use("/tracepoint", mount(receiver));
```

Point your SDK's `webhook` at `…/tracepoint/ingest`.

## Stores

| Store | Driver | For |
| --- | --- | --- |
| `jsonFileStore({ dir })` | none | zero-setup default — a directory of `<id>.json` + `<id>.png` |
| `sqliteStore({ file })` | `node:sqlite` (Node ≥ 22.5) or `better-sqlite3` | persistent-process apps; real filtering/search |

Drivers are optional peer dependencies loaded lazily — install only the one your store uses.

## Status

P3.1 — scaffold: `createReceiver` (ingest → store, outbound chain, retention). Stores,
dashboard, and connectors land in P3.2–P3.6 (see `docs/adr/0003-phase-3-webhook-kit.md`).
