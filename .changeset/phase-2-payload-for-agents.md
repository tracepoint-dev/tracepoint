---
"@tracepoint-dev/core": minor
"@tracepoint-dev/react": minor
---

Phase 2 — payload quality for agents. Report schema is now `2.0` (additive over `1.0`).

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
