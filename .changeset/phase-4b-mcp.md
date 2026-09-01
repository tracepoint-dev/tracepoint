---
"@tracepoint-dev/webhook-kit": minor
---

Read-only MCP endpoint (Phase 4b). `createReceiver({ mcp: true })` serves an
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
