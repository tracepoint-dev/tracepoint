/**
 * The `tracepoint://guide` MCP resource — how an agent should act on a report.
 * Kept as a string constant so the `./mcp` module has no file-read at runtime.
 */
export const GUIDE = `# Acting on a Tracepoint report

Each report describes an issue a user hit in a running web app, plus the technical context
around it (schema 2.0). Only reports a human has **approved** are exposed here.

## Read a report in this order

1. **report.description** — what the user said, in their words.
2. **target** — the element they pointed at:
   - target.component (React): \`name\` is the component, \`stack\` is its ancestor chain
     (nearest first), \`source\` is { file, line } when available. Start here.
   - target.primarySelector / xpath / outerHtml / accessibleName / text — identify the
     element when there is no component. selectorConfidence "positional" = fragile selector;
     lean on text / accessibleName / ancestors.
   - target.interactiveAncestor — the nearest button/link/role if a child node was clicked.
3. **errors** — uncaught exceptions + unhandled rejections. A non-empty array is usually the
   fastest path to the bug. stack has file:line (query strings scrubbed).
4. **console** — recent console output, oldest first. \`count\` means the line repeated.
5. **network** — request metadata (method, url, status, durationMs, bytes). status null or
   failed:true is a network failure; a 4xx/5xx near the report time is a lead. Bodies and
   headers are never captured.
6. **page** / **client** / **context** — reproduction environment and app-supplied values.

## Trust markers

- capture.console / capture.network — \`false\` means that stream was NOT collected, not that
  nothing happened. Don't infer "no failing requests" from an empty array unless the flag is
  true.
- capture.truncated — { console: N } / { network: N } means N oldest entries were dropped to
  fit the size limit.
- Redaction placeholders: «email», «card», «token», «jwt», «phone», and REDACTED in URLs.
  __tracepointNote in context flags trimmed keys.

## Don't

- Don't jump to target.component.source's line and start editing. It is often null, and when
  present it can be **stale** — it reflects the file as it was when the report was captured,
  and the file may have moved since. Open the file, confirm the component name and text
  match, then trust the line.
- Don't treat the screenshot as ground truth for state — it is a DOM rasterization and may
  omit cross-origin images, canvas, or video.
- Don't ask for request/response bodies or headers — they are never in the payload.
`;
