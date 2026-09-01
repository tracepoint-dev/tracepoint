# @tracepoint-dev/core

Framework-agnostic core of the [Tracepoint](https://github.com/tracepoint-dev/tracepoint)
feedback & diagnostics SDK: floating button → pick an element → screenshot → describe →
structured JSON to a webhook.

Using React? Reach for [`@tracepoint-dev/react`](https://www.npmjs.com/package/@tracepoint-dev/react)
instead. Don't have an endpoint to receive reports?
[`@tracepoint-dev/webhook-kit`](https://www.npmjs.com/package/@tracepoint-dev/webhook-kit)
is a receiver you mount in your own backend.

## Install

```bash
npm i @tracepoint-dev/core
```

## Usage

```ts
import { tracepoint } from "@tracepoint-dev/core";

const tp = tracepoint({
  webhook: "https://your-endpoint.example/hook", // the only required field
  env: "staging",
  release: "2.4.1",
  context: { plan: "pro" },
});

tp.open();                       // open the reporter yourself
tp.setContext({ userId: "u_1" }); // e.g. after login
tp.destroy();
```

`webhook` is the one required option. With no webhook the report is logged to the console
(and offered as a JSON download) so you can see the payload immediately.

To also capture what the app was *doing* — console output, uncaught errors, failed
requests — opt in with `console: true` / `network: true`. Off by default; see
[Diagnostics capture](#diagnostics-capture-opt-in) below.

## Customizing the UI

All presentation lives under `ui` — omit it for the default look, pass `false` for
headless, or pass an object to restyle the built-in reporter:

```ts
tracepoint({
  webhook: "https://…",
  ui: {
    position: "bottom-left",                       // corner
    theme: { accent: "#7c3aed", radius: "6px", colorScheme: "auto" },
    button: { icon: "<svg …>", label: "Feedback", variant: "pill" },
    trigger: "#my-help-button",                    // open on your own element's click
    icons: { close: "<svg …>" },
    labels: { title: "Send feedback", submit: "Send" },
  },
});
```

## Headless — bring your own UI

```ts
const tp = tracepoint({ webhook: "https://…", ui: false }); // no button, no panel

// wire these to your own buttons:
const target = await tp.pick();          // DescriptorBundle | null (null if cancelled)
const shot   = await tp.screenshot();    // Screenshot | null
await tp.send({ description, target, screenshot: shot });
```

## Diagnostics capture (opt-in)

Off by default. Turn on console and/or network capture so a report carries what the app
was *doing*, not just where the user was:

```ts
tracepoint({
  webhook: "https://…",
  console: true,                       // console.* + uncaught errors + unhandledrejection
  network: true,                       // fetch + XHR — metadata only, never bodies/headers
});

// or tune them:
tracepoint({
  webhook: "https://…",
  console: { levels: ["warn", "error"], limit: 100 },
  network: { denyUrls: ["/analytics", /segment\.io/] },
});
```

Both buffer continuously (so there's history from *before* the report) and are fully
removed by `destroy()`. Enabling either prints a one-time notice of what's now collected.
Nothing is sent until the user submits.

### Redaction

```ts
tracepoint({
  webhook: "https://…",
  redact: {
    selectors: [".secret"],            // blanked in the screenshot + descriptor
    text: (s) => s.replace(/int-\d+/g, "«id»"),  // your scrub of console args + context
    urlParams: ["tenant"],             // extra query keys to strip (added to the defaults)
    pii: true,                         // preset: email / card (Luhn) / JWT / known tokens / phone
  },
});
```

`redact: ["…selectors…"]` (a bare array) still works. Sensitive query params
(`token`, `access_token`, `secret`, …) are stripped from captured URLs and `page.url`
regardless. Full list of guarantees: [`docs/07-privacy.html`](https://github.com/tracepoint-dev/tracepoint/blob/main/docs/07-privacy.html).

### Fresh context at submit

```ts
tracepoint({
  webhook: "https://…",
  context: () => ({ route: currentRoute(), flags: featureFlags() }), // evaluated per report
});
```

## Script tag (no build)

```html
<script
  src="https://unpkg.com/@tracepoint-dev/core/global"
  data-webhook="https://your-endpoint.example/hook"
  data-env="staging"
></script>
```

Exposes `window.tracepoint` and auto-initialises from the `data-*` attributes. This bundle
inlines the screenshot engine, so it is noticeably larger than the npm build (~18 KB gzip
vs ~9.5 KB); the npm build loads the screenshot engine lazily on first use.

## The payload

Each report is a single JSON object POSTed to your `webhook` (schema `2.0`): the
description and annotations, the picked element's descriptor (selector, XPath, accessible
name, attributes, bounding box, truncated outer HTML, and — with `@tracepoint-dev/react` —
`component`), page URL/route, an inline base64 screenshot, browser/environment info, your
`context`, and — when opted in — `console`, `errors`, and `network`. A `capture` block
says what was collected and what got trimmed. Never captured: cookies, auth headers,
tokens, or request/response bodies.

The full JSON Schema ships with the package:

```ts
import schema from "@tracepoint-dev/core/schema" with { type: "json" };
```

## Security

- **It only sends a report when the user clicks submit.** Nothing goes out when the page
  loads, and nothing runs in the background.
- **It never reads cookies, `localStorage`, login tokens, or the contents of your network
  requests.** `console` and `network` capture are opt-in; even then, network capture is
  metadata only (method, URL, status, timing) and redaction runs before anything enters a
  buffer. See [`docs/07-privacy.html`](https://github.com/tracepoint-dev/tracepoint/blob/main/docs/07-privacy.html).
- **Before the screenshot, it blanks out password fields** (and restores them after).
  Anything you list in `redact` — plus credit-card fields and `.tp-redact` — is hidden from
  the screenshot too.
- **It captures the text/value of the one element the user picked**, never from password or
  hidden fields. It copies a short fixed list of attributes (`id`, `class`, `aria-*`, test
  IDs…), not every `data-*`, and truncates `outerHTML` rather than taking the whole subtree.
- **The screenshot is drawn from your page, in the browser.** No screenshot service, no
  upload — the pixels only travel in the payload you POST to your own `webhook`.
- **The widget runs in a shadow root**, so the rest of your page can't style or read it.
- **Reports go to your endpoint.** There is no Tracepoint server in the loop, and
  `Transport` is swappable if you want to send them somewhere else entirely.
- MIT, ~10 KB, dependencies make no network calls — small enough to read.
