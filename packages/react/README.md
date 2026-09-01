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
  is a prop (`webhook`, `env`, `release`, `context`, `redact`, `console`, `network`, `ui`).
  Place it once near the root. It calls `tracepoint()` in a browser-only effect (nothing
  runs during SSR), keeps `context` in sync when that prop's contents change, and calls
  `destroy()` on unmount. Renders nothing. Init-only props are read once on mount.
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

### Component / source mapping

While mounted, the adapter registers a descriptor contributor with core that reads the
**React component** for the picked DOM node off the fiber. Reports then carry
`target.component` — `{ name, stack, source }` — so an agent can jump from "the user
pointed here" to the component file. `name` / `stack` are reliable in dev, best-effort in
production (minifiers mangle names that aren't set via `displayName`). `source` (the
file:line) is read once, when the component first mounts — it can go **stale, not just
absent**, if the file changes afterwards (a later edit, or simply time passing between
when the report was filed and when someone looks at it). Treat it as a hint to verify
against `name`/`text`, not a coordinate to jump to blindly. Falls back to `null` silently
when nothing resolves.

## Security

This package captures, stores, and sends nothing of its own — it just starts and stops
core. Every safeguard in
[`@tracepoint-dev/core`'s Security section](https://www.npmjs.com/package/@tracepoint-dev/core#security)
applies unchanged: reports go out only on user submit, no cookies / tokens / storage are
read, password fields and your `redact` selectors are hidden from the screenshot, and the
payload only ever goes to your `webhook`. On the server (SSR) this component renders and
runs nothing at all.
