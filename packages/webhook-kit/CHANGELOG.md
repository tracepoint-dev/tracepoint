# @tracepoint-dev/webhook-kit

## 0.1.1

### Patch Changes

- Docs: clean package READMEs for the npm pages — drop internal milestone/status
  sections, add an Install section to each, use absolute links that resolve on
  npmjs.com, and document the report payload + JSON Schema (core) and the
  retention / auth / dashboard-URL behaviour (webhook-kit). No code changes.

## 0.1.0

### Minor Changes

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
