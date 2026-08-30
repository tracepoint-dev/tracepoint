---
"@tracepoint-dev/core": patch
"@tracepoint-dev/react": patch
"@tracepoint-dev/webhook-kit": patch
---

Docs: add a Security section to every package README describing what is and isn't
captured, where data goes, and the receiver's safeguards. `@tracepoint-dev/webhook-kit`'s
README is rewritten as a full setup guide — mental model, per-framework mounting
(Express / Next.js / Node / Vite), store comparison, routes table, and troubleshooting.
No code changes.
