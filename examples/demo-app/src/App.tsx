import { VERSION, tracepoint } from "@tracepoint-dev/core";
import { type CSSProperties, useEffect } from "react";

const page: CSSProperties = {
  fontFamily: "system-ui, -apple-system, sans-serif",
  lineHeight: 1.5,
  maxWidth: 640,
  margin: "0 auto",
  padding: 32,
};

/**
 * M1 demo: calls `tracepoint()` directly (the React adapter arrives in M2).
 * Exercised by the Playwright reporter spec.
 */
export function App() {
  useEffect(() => {
    const tp = tracepoint({ webhook: `${location.origin}/__tp_hook`, env: "demo" });
    return () => tp.destroy();
  }, []);

  return (
    <main style={page}>
      <h1>Tracepoint demo</h1>
      <p>
        <code>@tracepoint-dev/core</code> version{" "}
        <strong data-testid="core-version">{VERSION}</strong>
      </p>
      <button type="button" data-testid="sample-action">
        Create project
      </button>
      <p>Nothing happens when you click — that is the “bug” to report.</p>
    </main>
  );
}
