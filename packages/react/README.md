# @tracepoint-dev/react

React adapter for the [Tracepoint](../../README.md) feedback & diagnostics SDK.

**Status:** M0 scaffold — `<Tracepoint>` renders nothing, `useTracepoint()` returns
`null`. Lifecycle + SSR handling lands in milestone M2.

```tsx
import { Tracepoint, useTracepoint } from "@tracepoint-dev/react";

function App() {
  return (
    <>
      <Tracepoint webhook="https://..." env="staging" />
      {/* ... */}
    </>
  );
}
```

The adapter is deliberately thin: lifecycle, SSR safety, and prop reactivity only.
All capture logic lives in [`@tracepoint-dev/core`](../core).
