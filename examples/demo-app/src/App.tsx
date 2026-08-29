import { type TracepointHandle, VERSION, tracepoint } from "@tracepoint-dev/core";
import { type CSSProperties, useEffect, useRef, useState } from "react";

const page: CSSProperties = {
  fontFamily: "system-ui, -apple-system, sans-serif",
  lineHeight: 1.5,
  maxWidth: 640,
  margin: "0 auto",
  padding: 32,
};

const HOOK = () => `${location.origin}/__tp_hook`;

/** Default demo: `tracepoint()` with the built-in UI. */
function DefaultDemo() {
  useEffect(() => {
    const tp = tracepoint({ webhook: HOOK(), env: "demo" });
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

/** Headless demo (`?headless`): custom UI driving pick / screenshot / send. */
function HeadlessDemo() {
  const tp = useRef<TracepointHandle | null>(null);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    tp.current = tracepoint({ webhook: HOOK(), ui: false });
    return () => tp.current?.destroy();
  }, []);

  async function report() {
    setStatus("picking");
    const target = await tp.current?.pick();
    setStatus("capturing");
    const screenshot = await tp.current?.screenshot();
    setStatus("sending");
    const res = await tp.current?.send({ description: "headless report", target, screenshot });
    setStatus(res?.ok ? "sent" : "failed");
  }

  return (
    <main style={page}>
      <h1>Headless demo</h1>
      <button type="button" data-testid="headless-report" onClick={report}>
        Report an issue (custom UI)
      </button>
      <button type="button" data-testid="sample-action">
        Create project
      </button>
      <p data-testid="headless-status">{status}</p>
    </main>
  );
}

export function App() {
  const headless =
    typeof location !== "undefined" && new URLSearchParams(location.search).has("headless");
  return headless ? <HeadlessDemo /> : <DefaultDemo />;
}
