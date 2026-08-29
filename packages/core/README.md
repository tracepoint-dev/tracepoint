# @tracepoint-dev/core

Framework-agnostic core of the [Tracepoint](../../README.md) feedback & diagnostics SDK.

**Status:** M0 scaffold — exports the frozen type contract and a `tracepoint()` stub.
The capture pipeline (floating button, element picker, screenshot, payload assembly,
transport) lands in milestone M1.

```ts
import { tracepoint } from "@tracepoint-dev/core";

const tp = tracepoint({ webhook: "https://..." });
tp.open();
tp.setContext({ userId: "u_123" });
tp.destroy();
```
