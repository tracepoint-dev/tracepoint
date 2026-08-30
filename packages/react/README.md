# @tracepoint-dev/react

React adapter for the [Tracepoint](https://github.com/tracepoint-dev/tracepoint) feedback
& diagnostics SDK. A thin wrapper over
[`@tracepoint-dev/core`](https://www.npmjs.com/package/@tracepoint-dev/core) — lifecycle,
SSR safety and prop reactivity only.

## Install

```bash
npm i @tracepoint-dev/react
```

`react >= 18` is a peer dependency. `@tracepoint-dev/core` is bundled in as a dependency.

## Usage

```tsx
import { Tracepoint, useTracepoint } from "@tracepoint-dev/react";

function App() {
  return (
    <>
      <Tracepoint webhook="https://your-endpoint.example/hook" env="staging" />
      {/* your app */}
    </>
  );
}
```

- **`<Tracepoint {...config} />`** — every
  [`@tracepoint-dev/core`](https://www.npmjs.com/package/@tracepoint-dev/core) config key
  is a prop (`webhook`, `env`, `release`, `context`, `redact`, `ui`). Place it once near the
  root. It calls `tracepoint()` in a browser-only effect (nothing runs during SSR), keeps
  `context` in sync when that prop's contents change, and calls `destroy()` on unmount.
  Renders nothing. Init-only props are read once on mount.
- **`useTracepoint()`** → `TracepointHandle | null`. Reads the singleton and re-renders
  when it appears/disappears (via `useSyncExternalStore`). `null` before `<Tracepoint>`
  mounts and during SSR. Use it to open the reporter from your own UI:

  ```tsx
  function HelpMenu() {
    const tp = useTracepoint();
    return <button onClick={() => tp?.open()}>Report a problem</button>;
  }
  ```

The adapter is deliberately thin — lifecycle, SSR safety, prop reactivity only. All
capture logic lives in core.
