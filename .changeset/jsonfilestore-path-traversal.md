---
"@tracepoint-dev/webhook-kit": patch
---

Security: `jsonFileStore` now rejects report ids that aren't in the id charset
(`[0-9A-Za-z_-]`) before touching the filesystem. Previously a dashboard request
like `GET /tracepoint/reports/..%2f..%2fsecret` (or the matching delete route)
could read or delete `.json` files outside the store directory, because the
route's slash check ran on the raw path before `decodeURIComponent`. `get`,
`readScreenshot` and `delete` are all guarded now; `sqliteStore` was never
affected (the id is only ever a bound parameter). Custom stores can import the
`isSafeId` helper.
