# @tracepoint-dev/webhook-kit

## 0.2.0

### Minor Changes

- 2c21e3e: Report approval workflow (Phase 4a). Every report now has a triage `status`; a human
  approves or rejects it from the dashboard before it's actionable.

  - `StoredReport` and `ReportSummary` gain `status: "pending" | "approved" | "rejected"`
    (new reports are `"pending"`). New `ReportStatus` type.
  - `Store` interface gains `setStatus(id, status)`; `ListOptions` gains a `status` filter
    (baseline — honoured by every store).
  - `jsonFileStore` writes `status` into the record and back-fills `"pending"` for records
    written before the field existed. `sqliteStore` adds a `status` column + index and
    migrates pre-existing tables (`ALTER TABLE`).
  - Dashboard: `Pending / Approved / Rejected / All` tabs on the list (default **Pending**),
    a status badge per row, and Approve / Reject / Reset buttons on the detail page. New
    route `POST /reports/:id/status` (body `status=…`), guarded like the other mutations;
    unknown status → `400`.

  This is the gate the Phase 4b MCP reads through — it will only ever expose `approved`
  reports to an agent.

- 14217f1: Read-only MCP endpoint (Phase 4b). `createReceiver({ mcp: true })` serves an
  [MCP](https://modelcontextprotocol.io) Streamable HTTP endpoint at `{basePath}/mcp` so a
  coding agent can pull reports and act on them.

  - Transport is **stateless** (one JSON response per request, no session) — works on
    serverless. Guarded by `auth`.
  - Tools: `list_reports`, `get_report(id)`, `get_screenshot(id)`. Resource:
    `tracepoint://guide`. **Only `approved` reports are exposed**; `get_report` refuses any
    other id; there is no tool to change a status.
  - `@modelcontextprotocol/sdk` + `zod` are **optional peers** — `npm i` of the kit never
    pulls them, and nothing MCP loads until the first `/mcp` request. New `./mcp` subpath
    exports `mcpHandler(store)` for mounting it standalone.

## 0.1.2

### Patch Changes

- 87b4a87: Security: `jsonFileStore` now rejects report ids that aren't in the id charset
  (`[0-9A-Za-z_-]`) before touching the filesystem. Previously a dashboard request
  like `GET /tracepoint/reports/..%2f..%2fsecret` (or the matching delete route)
  could read or delete `.json` files outside the store directory, because the
  route's slash check ran on the raw path before `decodeURIComponent`. `get`,
  `readScreenshot` and `delete` are all guarded now; `sqliteStore` was never
  affected (the id is only ever a bound parameter). Custom stores can import the
  `isSafeId` helper.
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
