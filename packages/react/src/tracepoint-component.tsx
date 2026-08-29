import { type TracepointConfig, type TracepointHandle, tracepoint } from "@tracepoint-dev/core";
import { useEffect, useRef } from "react";

/** Props for `<Tracepoint>` — the full `TracepointConfig`, passed declaratively. */
export type TracepointProps = TracepointConfig;

/**
 * Drop-in component. Initialises Tracepoint in a browser-only effect (so it does
 * nothing during SSR), keeps `context` in sync with the prop, and tears down on
 * unmount. Renders nothing.
 *
 * Init-only props (`webhook`, `ui`, …) are read once on mount; changing them later
 * is ignored (core's singleton guard). `context` updates live.
 */
export function Tracepoint(props: TracepointProps): null {
  const propsRef = useRef(props);
  propsRef.current = props;
  const handleRef = useRef<TracepointHandle | null>(null);

  useEffect(() => {
    handleRef.current = tracepoint({ ...propsRef.current });
    return () => {
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, []);

  // Re-sync context only when its *contents* change — React hands us a new object
  // literal on most renders, so the stringified value is the real trigger.
  const contextKey = JSON.stringify(props.context ?? {});
  // biome-ignore lint/correctness/useExhaustiveDependencies: contextKey proxies props.context
  useEffect(() => {
    handleRef.current?.setContext(propsRef.current.context ?? {});
  }, [contextKey]);

  return null;
}
