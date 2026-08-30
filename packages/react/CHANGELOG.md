# @tracepoint-dev/react

## 0.1.0

### Minor Changes

- 0dc2edb: M2 — React adapter.

  `@tracepoint-dev/react`: `<Tracepoint {...config} />` initialises the SDK in a
  browser-only effect (SSR-safe — renders nothing, does nothing on the server), keeps
  `context` in sync when its contents change, and tears down on unmount. `useTracepoint()`
  returns the live `TracepointHandle | null` via `useSyncExternalStore`, re-rendering when
  the instance is created or destroyed — so a component can open the reporter or drive the
  headless pipeline from its own UI.

  `@tracepoint-dev/core`: adds `getInstance()` and `subscribeInstance()` for adapter authors.

### Patch Changes

- Updated dependencies [a7c0913]
- Updated dependencies [0dc2edb]
- Updated dependencies [5309dc4]
  - @tracepoint-dev/core@0.1.0
