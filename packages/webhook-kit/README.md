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

## Connectors

`import { discord } from "@tracepoint-dev/webhook-kit/connectors"` — a chain handler that
posts each report to a Discord webhook as an embed with the screenshot attached. Add it to
`handlers`. Slack / AI-summary follow the same `Handler` shape.

## Mounting

- `handleRequest(request)` — framework-agnostic (Web Fetch `Request` → `Response`)
- `@tracepoint-dev/webhook-kit/express` → `mount(receiver)` middleware
- `@tracepoint-dev/webhook-kit/node` → `nodeHandler(receiver)` for raw `http`, Connect, Vite

## Status

Phase 3 complete — receiver, `jsonFileStore` + `sqliteStore`, store-agnostic dashboard
(list / detail / delete / clear), `discord` connector, Express + node glue. Full
`SDK → receiver → dashboard` loop covered by Playwright.
