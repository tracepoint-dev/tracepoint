import { type TracepointHandle, getInstance, subscribeInstance } from "@tracepoint-dev/core";
import { useSyncExternalStore } from "react";

/**
 * The active Tracepoint handle, or `null` before `<Tracepoint>` has mounted.
 * Re-renders when the instance is created or destroyed. `null` during SSR.
 */
export function useTracepoint(): TracepointHandle | null {
  return useSyncExternalStore(subscribeInstance, getInstance, () => null);
}
