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

Each report is a single JSON object POSTed to your `webhook`: the description and
annotations, the picked element's descriptor (selector, XPath, accessible name,
attributes, bounding box, truncated outer HTML), page URL/route, an inline base64
screenshot, and browser/environment info. Never captured: cookies, auth headers, tokens,
or request/response bodies.

The full JSON Schema ships with the package:

```ts
import schema from "@tracepoint-dev/core/schema" with { type: "json" };
```

## Security

- **It only sends a report when the user clicks submit.** Nothing goes out when the page
  loads, and nothing runs in the background.
- **It never reads cookies, `localStorage`, login tokens, or the contents of your network
  requests.**
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
