# @tracepoint-dev/webhook-kit

The receiver side of [Tracepoint](https://github.com/tracepoint-dev/tracepoint). The SDK
in the browser POSTs each report somewhere — this is that somewhere. It's a small library
you mount **inside a server you already run**: it stores reports from
[`@tracepoint-dev/core`](https://www.npmjs.com/package/@tracepoint-dev/core), gives you a
dashboard to read them, and can forward them on to other tools. No hosted service, no
account, no database required to start.

## The mental model

Three moving parts. You already have the first and third — webhook-kit is the middle.

```
  BROWSER                      YOUR SERVER                      YOU
  -------                      -----------                      ---
  @tracepoint-dev/core  -POST->  createReceiver({ store })  ->  a store
  (button -> pick ->             mounted at /tracepoint          (files or SQLite)
   screenshot ->                       |
   describe -> submit)                 |-> dashboard  at /tracepoint
                                       |
                                       `-> handlers  (optional)
                                            e.g. discord(webhookUrl)
```

- **The receiver is just a request handler.** Give it a web `Request`, it returns a
  `Response`. Glue is included for Express and Node/Connect/Vite; frameworks with native
  `Request`/`Response` (Next.js, Hono, Remix) need no glue at all.
- **The store is swappable.** Start with the zero-dependency JSON-file store; move to
  SQLite when you want search and filtering. The dashboard works the same against either.
- **Handlers are optional.** Leave them out and reports just land in the store + dashboard.

## Install

```bash
npm i @tracepoint-dev/webhook-kit
```

No required dependencies. SQLite support pulls a driver only if you use `sqliteStore`.

## 60-second version (Express)

```ts
// server.js
import express from "express";
import { createReceiver } from "@tracepoint-dev/webhook-kit";
import { jsonFileStore } from "@tracepoint-dev/webhook-kit/stores";
import { mount } from "@tracepoint-dev/webhook-kit/express";

const receiver = createReceiver({
  store: jsonFileStore({ dir: ".tracepoint" }),
  dashboard: true,
});

const app = express();
app.use("/tracepoint", mount(receiver)); // serves /tracepoint/ingest + the dashboard
app.listen(3000);
```

Then in the app you want feedback on:

```ts
tracepoint({ webhook: "https://yourapp.com/tracepoint/ingest" });
```

Reports now land in `.tracepoint/reports/` and you can read them at
`https://yourapp.com/tracepoint`.

> **Don't** put `express.json()` (or any body parser) in front of the mount — the receiver
> reads the raw body itself, and a parser upstream will make ingest fail.

## Step by step

### 1. Create the receiver

```ts
import { createReceiver } from "@tracepoint-dev/webhook-kit";
import { jsonFileStore } from "@tracepoint-dev/webhook-kit/stores";

const receiver = createReceiver({
  store:     jsonFileStore({ dir: ".tracepoint" }), // required — where reports live
  dashboard: true,                                  // serve the read UI at the mount root
  handlers:  [],                                    // optional — outbound steps
  retention: { maxAge: "90d", maxCount: 5000 },     // optional — auto-prune
  auth:      undefined,                             // optional — gate the dashboard
  basePath:  "/tracepoint",                         // optional — default is "/tracepoint"
});
```

`createReceiver` returns one thing: `receiver.handleRequest(request)`, which takes a web
`Request` and resolves to a `Response`. `store.init()` (create the directory / tables)
runs automatically on the first request.

### 2. Mount it in your framework

**Express**

```ts
import { mount } from "@tracepoint-dev/webhook-kit/express";
app.use("/tracepoint", mount(receiver));
```

**Next.js — App Router** (no glue needed)

```ts
// app/tracepoint/[[...slug]]/route.ts
import { createReceiver } from "@tracepoint-dev/webhook-kit";
import { jsonFileStore } from "@tracepoint-dev/webhook-kit/stores";

const receiver = createReceiver({
  store: jsonFileStore({ dir: ".tracepoint" }),
  dashboard: true,
  basePath: "/tracepoint",
});

export const runtime = "nodejs";
const h = (req: Request) => receiver.handleRequest(req);
export { h as GET, h as POST };
```

The `[[...slug]]` catch-all lets one route file serve `/tracepoint`, `/tracepoint/ingest`,
and `/tracepoint/reports/…`. The same shape works for Remix, SvelteKit, Hono — anything
that hands you a web `Request`.

**Plain Node `http`, Connect, or a Vite dev server**

```ts
import { nodeHandler } from "@tracepoint-dev/webhook-kit/node";
const handle = nodeHandler(receiver);

// raw http:
http.createServer((req, res) => {
  if (req.url?.startsWith("/tracepoint")) return handle(req, res);
  /* ...your app... */
}).listen(3000);

// Vite plugin (dev):
server.middlewares.use((req, res, next) =>
  req.url?.startsWith("/tracepoint") ? handle(req, res, next) : next());
```

**Anything else** — build a `Request`, hand it over, send the `Response` back:

```ts
const response = await receiver.handleRequest(request);
```

### 3. Point the SDK at it

The ingest endpoint is `{basePath}/ingest`:

```ts
tracepoint({ webhook: "https://yourapp.com/tracepoint/ingest" });
// React:  <Tracepoint webhook="https://yourapp.com/tracepoint/ingest" />
```

A successful ingest replies `201 { ok: true, id }`.

### 4. Read the reports

With `dashboard: true`, open `{basePath}` in a browser. You get a list (newest first), a
detail view per report with the screenshot and the full element descriptor, per-row
delete, and clear-all. Server-rendered HTML, no build step, no client JS.

The `jsonFileStore` also writes `<dir>/reports/<id>.json` (the report) plus `<id>.png`
(the screenshot) — greppable, diffable, easy to back up.

## Choosing a store

| Store | Import | Needs | Use when |
| --- | --- | --- | --- |
| `jsonFileStore({ dir })` | `/stores` | nothing | Getting started; low-to-moderate volume; you like plain files. The default. |
| `sqliteStore({ file })` | `/stores` | Node ≥ 22.5 (built-in `node:sqlite`), *or* `npm i better-sqlite3` | Long-running server; you want the dashboard's route filter and text search; thousands of reports. |

```ts
import { sqliteStore } from "@tracepoint-dev/webhook-kit/stores";
const store = sqliteStore({ file: "./tracepoint.db" }); // or ":memory:"
```

The search / route-filter inputs appear in the dashboard only when the store supports them
(`store.capabilities`) — SQLite does, the file store doesn't. A custom store is any object
implementing the `Store` interface (`init / save / list / get / readScreenshot / delete /
clear`); Postgres and libSQL adapters are on the roadmap.

**Already have reports in a database?** `createDashboard({ store })` from
`@tracepoint-dev/webhook-kit/dashboard` mounts just the read UI against any store, without
the ingest endpoint.

## Forwarding reports (optional)

A **handler** runs once per report, after it's stored. Handlers run in order; one that
throws is logged and skipped — it never blocks the `201` or the other handlers.

```ts
import { discord } from "@tracepoint-dev/webhook-kit/connectors";

createReceiver({
  store,
  handlers: [discord(process.env.DISCORD_WEBHOOK_URL)], // embed + screenshot; no-op if URL is undefined
});
```

Roll your own — a handler is just a function `(report, ctx) => void | Promise<void>`:

```ts
const toLinear = async (report, ctx) => {
  const { description } = report.payload.report;
  await fetch("https://api.linear.app/…", { /* … */ });
  const shot = await ctx.readScreenshot(); // { mimeType, bytes } | null
};
```

Slack and an AI-summary handler follow the same shape and are planned as built-ins.

## Retention

Pruned on every ingest. Omit `retention` to keep everything.

- `maxAge` — duration string: `"30m"`, `"12h"`, `"90d"`, `"6w"`. Older reports are deleted.
- `maxCount` — keep only the newest N.

```ts
retention: { maxAge: "90d", maxCount: 5000 }
```

## Auth

`auth` is a function given the incoming `Request`; return `false` (or throw) to deny with
`401`. It guards the dashboard and the delete / clear routes. **It does not guard
`/ingest`** — reports come from anonymous browsers, so that endpoint stays open by design.

```ts
auth: (req) => req.headers.get("authorization") === `Bearer ${process.env.TP_DASH_TOKEN}`
```

For real access control, put the mount behind whatever your app already uses (session
middleware, a reverse-proxy auth layer, an SSO gateway) and keep `auth` as a lightweight
second check.

## Routes served

All relative to `basePath` (default `/tracepoint`).

| Method & path | What | Auth |
| --- | --- | --- |
| `POST /ingest` | SDK posts a report → `201 { ok, id }` | open |
| `GET /` | dashboard — report list | guarded |
| `GET /reports/:id` | dashboard — one report | guarded |
| `GET /reports/:id/screenshot` | the PNG bytes | guarded |
| `POST /reports/:id/delete` | delete one report | guarded |
| `POST /clear` | delete all reports | guarded |

Dashboard routes exist only when `dashboard: true`. Anything else under the prefix → `404`.

## Security

- **Runs in your infrastructure.** No phone-home, no analytics. The only outbound calls
  are the handlers you add yourself.
- **Screenshots are saved separately** from the report JSON, not stuffed inside it. The
  stored report has the screenshot data URL stripped out.
- **The SQLite store builds every query with placeholders** (including the search and
  route filters), so report text can't leak into SQL.
- **Report IDs are generated on the server**, never taken from whoever's posting. The file
  store also refuses any id outside its own charset, so a dashboard URL can't walk out of
  the reports directory. Custom stores that map an id to a path should import `isSafeId`
  from `@tracepoint-dev/webhook-kit/stores`.
- **The dashboard and the delete / clear actions run through your `auth` check.** `/ingest`
  is open on purpose — logged-out browsers post to it — so put your normal rate limit and
  request-size limit in front of it.
- **A failing handler is logged and skipped** — the report still saves and the server
  stays up.
- **`better-sqlite3` only loads if you use the SQLite store.** `retention` auto-deletes
  old reports so data doesn't pile up.

## When it doesn't work

| Symptom | Cause |
| --- | --- |
| Ingest returns `400 invalid JSON body` | A body parser ran before the mount and consumed the stream. Remove it for this path. |
| Everything under the prefix is `404` | `basePath` and the mount path disagree — they must match. |
| Dashboard is `404` but ingest works | `dashboard: true` is missing. |
| SDK reports never arrive | Wrong URL (must end in `/ingest`), or a CORS block on the receiver's host. |
| `sqliteStore needs a SQLite driver` | Node < 22.5 and no `better-sqlite3`. Upgrade Node or `npm i better-sqlite3`. |
| Screenshots missing in the dashboard | The SDK captured none (cross-origin canvas taint, or capture failed). The report still stores; `screenshot` is `null`. |
