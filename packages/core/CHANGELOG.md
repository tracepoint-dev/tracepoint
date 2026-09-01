# @tracepoint-dev/core

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

## 0.1.2

### Patch Changes

- 5a1132d: Docs: add a Security section to every package README describing what is and isn't
  captured, where data goes, and the receiver's safeguards. `@tracepoint-dev/webhook-kit`'s
  README is rewritten as a full setup guide — mental model, per-framework mounting
  (Express / Next.js / Node / Vite), store comparison, routes table, and troubleshooting.
  No code changes.

## 0.1.1

### Patch Changes

- Docs: clean package READMEs for the npm pages — drop internal milestone/status
  sections, add an Install section to each, use absolute links that resolve on
  npmjs.com, and document the report payload + JSON Schema (core) and the
  retention / auth / dashboard-URL behaviour (webhook-kit). No code changes.

## 0.1.0

### Minor Changes

- a7c0913: M1 — capture pipeline. `tracepoint()` factory with a singleton guard and config
  validation; a shadow-DOM floating button + reporter panel (idle → picking → editing →
  submitting → success/error state machine); element picker; descriptor bundle (filtered
  CSS selector + confidence, XPath, allow-listed attributes, safe field value, nearest
  interactive ancestor, accessible name, truncated outerHTML, ancestor chain); lazy
  `modern-screenshot` capture (viewport-clipped, scale-capped, own UI excluded, fails
  soft) with pre-capture redaction (password blanking + selector hiding) and a
  selection-rect annotation; payload assembler for the v1 envelope; `WebhookTransport`
  (2 retries on network / 5xx) and a `ConsoleTransport` default.

  Two builds: the npm package (screenshot engine loaded lazily) and a self-contained
  `<script src>` IIFE that sets `window.tracepoint` and auto-initialises from
  `data-webhook`.

  Customization (`ui` config): CSS-variable theming, `position`, `button`
  (icon / label / variant), `labels`, `icons`, and a `trigger` selector for
  opening from your own element. Headless mode — `ui: false` mounts no DOM and the
  handle exposes `pick()` / `screenshot()` / `send()` for a fully custom UI.

- 0dc2edb: M2 — React adapter.

  `@tracepoint-dev/react`: `<Tracepoint {...config} />` initialises the SDK in a
  browser-only effect (SSR-safe — renders nothing, does nothing on the server), keeps
  `context` in sync when its contents change, and tears down on unmount. `useTracepoint()`
  returns the live `TracepointHandle | null` via `useSyncExternalStore`, re-rendering when
  the instance is created or destroyed — so a component can open the reporter or drive the
  headless pipeline from its own UI.

  `@tracepoint-dev/core`: adds `getInstance()` and `subscribeInstance()` for adapter authors.

- 5309dc4: Phase 3 — `@tracepoint-dev/webhook-kit`, a mountable receiver library for your own
  backend (ADR 0003).

  - `createReceiver({ store, handlers?, retention?, dashboard?, auth?, basePath? })` →
    `handleRequest(Request): Promise<Response>`. `POST /ingest` stores the report (screenshot
    split out-of-band), runs the outbound `handlers` chain (failures logged, never block the
    200), and prunes per `retention` (`maxAge` / `maxCount`).
  - **Stores** (`/stores`): `jsonFileStore({ dir })` — zero-dependency, a directory of files;
    `sqliteStore({ file })` — `node:sqlite` or `better-sqlite3` (optional lazy peer), with
    real `since` / `route` / `search` filtering. Both implement one `Store` interface, so the
    dashboard is store-agnostic.
  - **Dashboard** (`dashboard: true` or standalone `createDashboard`): server-rendered,
    no build step — list, detail (descriptor + screenshot + raw payload), per-row delete,
    clear-all. Search/route filters appear only when the store supports them.
  - **Connectors** (`/connectors`): `discord(webhookUrl)` — chain handler that posts an embed
    with the screenshot attached.
  - **Glue**: `/express` (`mount`) and `/node` (`nodeHandler`) for Express / Connect / Vite.

  `@tracepoint-dev/core` also now ships the report JSON Schema at `./schema`
  (`@tracepoint-dev/core/schema`).
