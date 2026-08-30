# @tracepoint-dev/react

## 0.1.2

### Patch Changes

- 5a1132d: Docs: add a Security section to every package README describing what is and isn't
  captured, where data goes, and the receiver's safeguards. `@tracepoint-dev/webhook-kit`'s
  README is rewritten as a full setup guide — mental model, per-framework mounting
  (Express / Next.js / Node / Vite), store comparison, routes table, and troubleshooting.
  No code changes.
- Updated dependencies [5a1132d]
  - @tracepoint-dev/core@0.1.2

## 0.1.1

### Patch Changes

- Docs: clean package READMEs for the npm pages — drop internal milestone/status
  sections, add an Install section to each, use absolute links that resolve on
  npmjs.com, and document the report payload + JSON Schema (core) and the
  retention / auth / dashboard-URL behaviour (webhook-kit). No code changes.
- Updated dependencies
  - @tracepoint-dev/core@0.1.1

## 0.1.0

### Minor Changes

- 0dc2edb: M2 — React adapter.

  `@tracepoint-dev/react`: `<Tracepoint {...config} />` initialises the SDK in a
  browser-only effect (SSR-safe — renders nothing, does nothing on the server), keeps
  `context` in sync when its contents change, and tears down on unmount. `useTracepoint()`
  returns the live `TracepointHandle | null` via `useSyncExternalStore`, re-rendering when
  the instance is created or destroyed — so a component can open the reporter or drive the
  headless pipeline from its own UI.

  `@tracepoint-dev/core`: adds `getInstance()` and `subscribeInstance()` for adapter authors.

### Patch Changes

- Updated dependencies [a7c0913]
- Updated dependencies [0dc2edb]
- Updated dependencies [5309dc4]
  - @tracepoint-dev/core@0.1.0
