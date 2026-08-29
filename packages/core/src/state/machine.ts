/**
 * Pure reducer + a thin observable wrapper for the reporter flow.
 *
 * `reduce` never touches the DOM and never runs effects — it just names them.
 * The coordinator in `tracepoint.ts` runs each effect.
 */
import { warnOnce } from "../util/logger.js";
import type { Effect, Event, Machine, State, Transition } from "./machine.types.js";

/** @returns the next state + effects, or `null` if the event is illegal here. */
export function reduce(state: State, event: Event): Transition | null {
  switch (state) {
    case "idle":
      if (event.type === "OPEN") {
        return { state: "picking", effects: [{ type: "startPicking" }] };
      }
      return null;

    case "picking":
      if (event.type === "PICK") {
        return {
          state: "editing",
          effects: [
            { type: "stopPicking" },
            { type: "buildDescriptor", element: event.element },
            { type: "startScreenshot" },
          ],
        };
      }
      if (event.type === "CANCEL") {
        return { state: "idle", effects: [{ type: "stopPicking" }] };
      }
      return null;

    case "editing":
      if (event.type === "SUBMIT") {
        return { state: "submitting", effects: [{ type: "sendPayload" }] };
      }
      if (event.type === "CANCEL" || event.type === "CLOSE") {
        return { state: "idle", effects: [{ type: "resetDraft" }] };
      }
      return null;

    case "submitting":
      if (event.type === "SUBMIT_OK") return { state: "success", effects: [] };
      if (event.type === "SUBMIT_ERR") return { state: "error", effects: [] };
      return null;

    case "error":
      if (event.type === "RETRY") {
        return { state: "submitting", effects: [{ type: "sendPayload" }] };
      }
      if (event.type === "CLOSE") {
        return { state: "idle", effects: [{ type: "resetDraft" }] };
      }
      return null;

    case "success":
      if (event.type === "CLOSE") {
        return { state: "idle", effects: [{ type: "resetDraft" }] };
      }
      return null;
  }
}

/**
 * Wrap {@link reduce} in a small observable. On a legal event: set state, run the
 * effects in order, then notify subscribers. Illegal events warn once and no-op.
 */
export function createMachine(runEffect: (effect: Effect) => void): Machine {
  let state: State = "idle";
  const listeners = new Set<(state: State) => void>();

  return {
    getState: () => state,

    dispatch(event) {
      const next = reduce(state, event);
      if (!next) {
        warnOnce(`illegal:${state}:${event.type}`, `ignored ${event.type} while ${state}`);
        return;
      }
      state = next.state;
      for (const effect of next.effects) runEffect(effect);
      for (const listener of listeners) listener(state);
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
