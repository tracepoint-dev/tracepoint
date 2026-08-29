# Tracepoint

Open-source, developer-first feedback & diagnostics SDK for web apps. Someone using a
running app reports an issue in place — floating button, pick an element, screenshot,
annotate, describe — and Tracepoint attaches the technical context around it: URL/route,
DOM node, browser/env, screenshot, and (later) console + network. Feedback flows to your
existing tools via webhook — Tracepoint feeds them, it doesn't replace them.

**Status:** pre-release. Phase 1 (MVP SDK) — milestone M0 (scaffold) done. No published
packages yet.

## Packages

| Package | What it is |
| --- | --- |
| [`@tracepoint-dev/core`](./packages/core) | Framework-agnostic capture core |
| [`@tracepoint-dev/react`](./packages/react) | React adapter (thin wrapper over core) |
| [`@tracepoint-dev/connector-discord`](./packages/connector-discord) | Payload → Discord webhook formatter |
| [`examples/demo-app`](./examples/demo-app) | Vite + React app for dogfooding and e2e |

## Working with the repo

```bash
pnpm install
pnpm verify        # lint + build + typecheck + unit tests
pnpm e2e           # Playwright against the demo app
pnpm dev:demo      # run the demo app at http://localhost:3100
```

Toolchain: pnpm workspaces · tsup (build) · Vitest (unit) · Playwright (e2e) ·
Biome (lint/format) · Changesets (versioning). Requires Node ≥ 20 (repo pins 22).

## Repo layout

- [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) — source of truth: decisions, status, build order
- [`CLAUDE.md`](./CLAUDE.md) / [`AGENTS.md`](./AGENTS.md) — working rules for contributors and AI assistants
- [`docs/`](./docs) — design docs (kickoff, positioning, Phase 0 spike, Phase 1 plan)
- `packages/`, `examples/` — the workspace
- `spike/phase-0/` — throwaway capture spike; not part of the shipped packages

## License

MIT — see [`LICENSE`](./LICENSE).
