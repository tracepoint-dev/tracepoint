# Tracepoint

Open-source, developer-first feedback & diagnostics SDK for web apps. Someone using a
running app reports an issue in place — floating button, pick an element, screenshot,
annotate, describe — and Tracepoint attaches the technical context around it: URL/route,
DOM node, browser/env, screenshot, and (later) console + network. Feedback flows to your
existing tools via webhook — Tracepoint feeds them, it doesn't replace them.

**Status:** early. `0.1.0` on npm — capture SDK, React adapter, and a self-hostable
receiver. Console + network capture is next.

## Packages

| Package | What it is |
| --- | --- |
| [`@tracepoint-dev/core`](./packages/core) | Framework-agnostic capture SDK |
| [`@tracepoint-dev/react`](./packages/react) | React adapter (thin wrapper over core) |
| [`@tracepoint-dev/webhook-kit`](./packages/webhook-kit) | Mountable receiver — store, dashboard, outbound chain |
| [`examples/demo-app`](./examples/demo-app) | Vite + React app for dogfooding and e2e |

## Quick start

```bash
npm i @tracepoint-dev/core        # or @tracepoint-dev/react
```

```ts
import { tracepoint } from "@tracepoint-dev/core";

tracepoint({ webhook: "https://your-endpoint.example/hook" });
```

That mounts the floating button; each report is structured JSON POSTed to your `webhook`.
No endpoint yet? Mount [`@tracepoint-dev/webhook-kit`](./packages/webhook-kit) in your own
backend to store reports and get a dashboard. Per-package docs:
[core](./packages/core) · [react](./packages/react) · [webhook-kit](./packages/webhook-kit).

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
