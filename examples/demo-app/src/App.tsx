import { VERSION } from "@tracepoint-dev/core";
import { Tracepoint, useTracepoint } from "@tracepoint-dev/react";
import { type CSSProperties, useState } from "react";

const page: CSSProperties = {
  fontFamily: "system-ui, -apple-system, sans-serif",
  lineHeight: 1.5,
  maxWidth: 640,
  margin: "0 auto",
  padding: 32,
};

const HOOK = `${location.origin}/tracepoint/ingest`;

/** Default demo: the `<Tracepoint>` adapter with the built-in UI. */
function DefaultDemo() {
  return (
    <main style={page}>
      <Tracepoint webhook={HOOK} env="demo" />
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

/** Headless demo (`?headless`): `<Tracepoint ui={false}>` + a custom trigger via the hook. */
function HeadlessDemo() {
  const tp = useTracepoint();
  const [status, setStatus] = useState("idle");

  async function report() {
    setStatus("picking");
    const target = await tp?.pick();
    setStatus("capturing");
    const screenshot = await tp?.screenshot();
    setStatus("sending");
    const res = await tp?.send({ description: "headless report", target, screenshot });
    setStatus(res?.ok ? "sent" : "failed");
  }

  return (
    <main style={page}>
      <Tracepoint webhook={HOOK} ui={false} />
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

/** Diagnostics demo (`?diagnostics`): console + network capture opted in. */
function DiagnosticsDemo() {
  return (
    <main style={page}>
      <Tracepoint webhook={HOOK} env="demo" console network />
      <h1>Diagnostics demo</h1>
      <button
        type="button"
        data-testid="log-error"
        onClick={() => console.error("kaboom from demo")}
      >
        Log a console error
      </button>{" "}
      <button
        type="button"
        data-testid="bad-fetch"
        onClick={() => {
          void fetch("/tracepoint/does-not-exist").catch(() => {});
        }}
      >
        Trigger a failing fetch
      </button>
      <p>
        <button type="button" data-testid="sample-action">
          Create project
        </button>
      </p>
    </main>
  );
}

export function App() {
  const params = new URLSearchParams(typeof location !== "undefined" ? location.search : "");
  if (params.has("headless")) return <HeadlessDemo />;
  if (params.has("diagnostics")) return <DiagnosticsDemo />;
  return <DefaultDemo />;
}
