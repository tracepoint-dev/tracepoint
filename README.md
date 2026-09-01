# Tracepoint

Open-source, developer-first feedback & diagnostics SDK for web apps. Someone using a
running app reports an issue in place — floating button, pick an element, screenshot,
annotate, describe — and Tracepoint attaches the technical context around it: URL/route,
DOM node, browser/env, screenshot, and — opt-in — console + network + the React component
the element came from. Feedback flows to your existing tools via webhook — Tracepoint
feeds them, it doesn't replace them.

**Status:** early, but usable. On npm — capture SDK (report schema `2.0`), React adapter,
and a self-hostable receiver with a triage dashboard and a read-only MCP endpoint for
coding agents.

## Packages

| Package | What it is | Links |
| --- | --- | --- |
| `@tracepoint-dev/core` | Framework-agnostic capture SDK | [npm](https://www.npmjs.com/package/@tracepoint-dev/core) · [readme](./packages/core) |
| `@tracepoint-dev/react` | React adapter (thin wrapper over core) | [npm](https://www.npmjs.com/package/@tracepoint-dev/react) · [readme](./packages/react) |
| `@tracepoint-dev/webhook-kit` | Mountable receiver — store, triage dashboard, outbound chain, MCP endpoint | [npm](https://www.npmjs.com/package/@tracepoint-dev/webhook-kit) · [readme](./packages/webhook-kit) |
| `examples/demo-app` | Vite + React app for dogfooding and e2e | [src](./examples/demo-app) |

## Quick start

**Vanilla JS / any framework** — [`@tracepoint-dev/core`](https://www.npmjs.com/package/@tracepoint-dev/core)

```ts
import { tracepoint } from "@tracepoint-dev/core";

tracepoint({ webhook: "https://yourapp.com/tracepoint/ingest" });
```

**React** — [`@tracepoint-dev/react`](https://www.npmjs.com/package/@tracepoint-dev/react)

```tsx
import { Tracepoint } from "@tracepoint-dev/react";

<Tracepoint webhook="https://yourapp.com/tracepoint/ingest" />;
```

Either one mounts the floating button; each report is structured JSON POSTed to your
`webhook`. To capture what the app was *doing* — console, failed requests, uncaught
errors — opt in:

```ts
tracepoint({ webhook: "…", console: true, network: true }); // off by default; see the core readme
```

**Receive the reports** — [`@tracepoint-dev/webhook-kit`](https://www.npmjs.com/package/@tracepoint-dev/webhook-kit),
mounted in your own backend

```ts
import { createReceiver } from "@tracepoint-dev/webhook-kit";
import { jsonFileStore } from "@tracepoint-dev/webhook-kit/stores";
import { mount } from "@tracepoint-dev/webhook-kit/express";

const receiver = createReceiver({
  store: jsonFileStore({ dir: ".tracepoint" }),
  dashboard: true, // triage: reports land as "pending", you approve/reject them
  mcp: true,       // read-only MCP endpoint at /tracepoint/mcp — approved reports only
});
app.use("/tracepoint", mount(receiver)); // ingest at /tracepoint/ingest, dashboard at /tracepoint
```

No backend to mount it in? Point `webhook` at any URL that accepts a POST (webhook.site,
a serverless function, an existing endpoint) — the receiver is optional.

**Point a coding agent at it** — with `mcp: true`, an agent (Claude Code, Cursor) can pull
approved reports and act on them over MCP. `@modelcontextprotocol/sdk` + `zod` are optional
peers; nothing MCP loads until the first `/mcp` request.

## Security

Tracepoint is built to be safe to drop into a production app.

- **The SDK sends nothing until the user submits a report** — no background collection, no
  network on load. It never reads cookies, `localStorage`, tokens, or request/response
  bodies. Password fields and your `redact` selectors are hidden before the screenshot,
  which is rendered from the DOM in the browser (no third-party screenshot service).
- **Reports go only to the `webhook` URL you set.** There is no Tracepoint server.
- **`webhook-kit` runs entirely in your infrastructure** — no phone-home, parameterized
  SQL, server-generated ids, isolated handler failures, `auth`-gated dashboard.

Details in each package's Security section: [core](./packages/core#security) ·
[react](./packages/react#security) · [webhook-kit](./packages/webhook-kit#security). To
report a vulnerability, open a
[GitHub security advisory](https://github.com/tracepoint-dev/tracepoint/security/advisories/new).

## Working with the repo

```bash
pnpm install
pnpm verify        # lint + build + typecheck + unit tests
pnpm e2e           # Playwright against the demo app
pnpm dev:demo      # run the demo app at http://localhost:3100
```

Toolchain: pnpm workspaces · tsup (build) · Vitest (unit) · Playwright (e2e) ·
Biome (lint/format) · Changesets (versioning). Requires Node ≥ 20 (repo pins 22).

## License

MIT — see [`LICENSE`](./LICENSE).
