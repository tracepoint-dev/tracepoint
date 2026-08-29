# Tracepoint

Open-source, developer-first feedback & diagnostics SDK for web apps. Someone using a
running app reports an issue in place — floating button, pick an element, screenshot,
annotate, describe — and Tracepoint attaches the technical context around it: URL/route,
DOM node, browser/env, screenshot, and (later) console + network. Feedback flows to your
existing tools via webhook — Tracepoint feeds them, it doesn't replace them.

**Status:** pre-release. Phase 1 (MVP SDK) in progress. No published packages yet.

## Repo layout

- [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) — source of truth: decisions, status, build order
- [`CLAUDE.md`](./CLAUDE.md) / [`AGENTS.md`](./AGENTS.md) — working rules for contributors and AI assistants
- [`docs/`](./docs) — design docs (kickoff, positioning, Phase 0 spike, Phase 1 plan)
- `spike/phase-0/` — throwaway capture spike; not part of the shipped packages

## License

MIT — see [`LICENSE`](./LICENSE).
