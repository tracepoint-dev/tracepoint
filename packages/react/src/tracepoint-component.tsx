import {
  type TracepointConfig,
  type TracepointHandle,
  registerDescriptorContributor,
  tracepoint,
} from "@tracepoint-dev/core";
import { useEffect, useRef } from "react";
import { readFiberComponent } from "./fiber-source.js";

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
    // Teach core how to read a React component off a picked DOM node.
    const unregister = registerDescriptorContributor(readFiberComponent);
    return () => {
      unregister();
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, []);

  // Re-sync context only when its *contents* change — React hands us a new object
  // literal on most renders, so the stringified value is the real trigger. The
  // function form of `context` is owned by core (evaluated at submit), not here.
  const contextKey = JSON.stringify(
    typeof props.context === "function" ? "__fn__" : (props.context ?? {}),
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: contextKey proxies props.context
  useEffect(() => {
    const ctx = propsRef.current.context;
    if (typeof ctx !== "function") handleRef.current?.setContext(ctx ?? {});
  }, [contextKey]);

  return null;
}
