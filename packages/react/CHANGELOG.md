# @tracepoint-dev/react

## 0.2.0

### Minor Changes

- ae7d3d2: Phase 2 — payload quality for agents. Report schema is now `2.0` (additive over `1.0`).

  **core**

  - **Opt-in `console` capture** — `console: true | { levels?, limit?, maxEntryBytes? }`.
    Buffers `console.*` plus uncaught errors and unhandled rejections; consecutive
    duplicates collapse with a `count`.
  - **Opt-in `network` capture** — `network: true | { limit?, denyUrls? }`. `fetch` + XHR
    **metadata only** (method, cleaned URL, status, timing, `Content-Length` bytes) — never
    bodies or headers. The SDK's own webhook POST is excluded.
  - **`redact` object form** — `{ selectors?, text?, urlParams?, pii? }`. Bare `string[]`
    still works. `pii: true` enables a narrow email / card (Luhn) / JWT / known-token /
    E.164-phone preset. Sensitive query params are stripped from captured URLs and
    `page.url` / `referrer` by default.
  - **Function-form `context`** — `context: () => ({...})` is evaluated at submit for fresh
    values.
  - New envelope keys: `console`, `errors`, `network`, `capture`. New `target.component`
    (filled by an adapter). Payload has soft/hard size ceilings — console then network are
    trimmed oldest-first, with counts in `capture.truncated`.
  - New exports: `registerDescriptorContributor`, types `DescriptorComponentInfo`,
    `ConsoleCaptureConfig`, `NetworkCaptureConfig`, `RedactConfig`, `ConsoleLevel`.
  - All capture patches are removed and buffers cleared on `destroy()`. Redaction runs
    before anything enters a buffer.

  **react**

  - `<Tracepoint>` registers a descriptor contributor that reads the picked node's React
    component off the fiber — reports carry `target.component` (`{ name, stack, source }`).
    Reliable in dev, best-effort in production, `null` on failure.
  - `console` / `network` are passthrough props.

### Patch Changes

- Updated dependencies [ae7d3d2]
  - @tracepoint-dev/core@0.2.0

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
