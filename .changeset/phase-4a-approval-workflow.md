---
"@tracepoint-dev/webhook-kit": minor
---

Report approval workflow (Phase 4a). Every report now has a triage `status`; a human
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
