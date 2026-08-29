# @tracepoint-dev/core

Framework-agnostic core of the [Tracepoint](../../README.md) feedback & diagnostics SDK:
floating button → pick an element → screenshot → describe → structured JSON to a webhook.

## npm

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

## Status

M1 complete — capture pipeline, redaction, screenshot, payload assembly, webhook +
console transports. The React adapter is [`@tracepoint-dev/react`](../react) (M2).
