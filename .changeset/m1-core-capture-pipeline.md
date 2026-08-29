---
"@tracepoint-dev/core": minor
---

M1 — capture pipeline. `tracepoint()` factory with a singleton guard and config
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
