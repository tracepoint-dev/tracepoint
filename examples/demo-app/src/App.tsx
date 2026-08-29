import { VERSION } from "@tracepoint-dev/core";
import { Tracepoint, useTracepoint } from "@tracepoint-dev/react";
import type { CSSProperties } from "react";

const page: CSSProperties = {
  fontFamily: "system-ui, -apple-system, sans-serif",
  lineHeight: 1.5,
  maxWidth: 640,
  margin: "0 auto",
  padding: 32,
};

/**
 * M0 smoke screen. Its only job is to prove the workspace packages resolve and
 * render inside a real Vite + React app. Replaced with a proper demo in M1/M2.
 */
export function App() {
  const tp = useTracepoint();

  return (
    <main style={page}>
      <h1>Tracepoint demo</h1>
      <p>
        Workspace wiring check. <code>@tracepoint-dev/core</code> version:{" "}
        <strong data-testid="core-version">{VERSION}</strong>
      </p>
      <p>
        <code>useTracepoint()</code> →{" "}
        <strong data-testid="handle-state">{tp ? "handle" : "null (stub)"}</strong>
      </p>
      <Tracepoint webhook="https://example.test/hook" env="demo" />
    </main>
  );
}
