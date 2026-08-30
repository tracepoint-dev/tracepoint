# @tracepoint-dev/webhook-kit

The receiver side of [Tracepoint](https://github.com/tracepoint-dev/tracepoint) — a
library you mount **inside your own backend** (not a hosted service). It stores incoming
reports from [`@tracepoint-dev/core`](https://www.npmjs.com/package/@tracepoint-dev/core),
serves a dashboard, and can fan out to other tools.

## Install

```bash
npm i @tracepoint-dev/webhook-kit
```

Zero required dependencies. SQLite support pulls a driver only if you use `sqliteStore`
(see [Stores](#stores)).

## Usage

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

Point your SDK's `webhook` at `…/tracepoint/ingest`. With `dashboard: true`, the dashboard
renders at the mount root (`…/tracepoint`) — list, per-report detail with screenshot and
descriptor, delete, and clear-all.

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

## Retention

`retention: { maxAge, maxCount }` is pruned on each ingest. `maxAge` takes a duration
string (`"90d"`, `"12h"`, `"30m"`); `maxCount` keeps only the newest N reports.

## Auth

`auth: (request) => boolean | Promise<boolean>` gates the dashboard and its routes. The
`/ingest` endpoint is intentionally left open — reports come from browsers.
