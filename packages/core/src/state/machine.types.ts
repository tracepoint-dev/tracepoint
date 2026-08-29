/** State-machine vocabulary for the reporter flow (ADR 0001). */

export type State = "idle" | "picking" | "editing" | "submitting" | "success" | "error";

export type Event =
  | { type: "OPEN" }
  | { type: "PICK"; element: Element }
  | { type: "CANCEL" }
  | { type: "SUBMIT" }
  | { type: "SUBMIT_OK" }
  | { type: "SUBMIT_ERR" }
  | { type: "RETRY" }
  | { type: "CLOSE" };

/** Side-effects the reducer asks the coordinator to run. Never run inside the reducer. */
export type Effect =
  | { type: "startPicking" }
  | { type: "stopPicking" }
  | { type: "buildDescriptor"; element: Element }
  | { type: "startScreenshot" }
  | { type: "sendPayload" }
  | { type: "resetDraft" };

export interface Transition {
  state: State;
  effects: Effect[];
}

export interface Machine {
  getState(): State;
  dispatch(event: Event): void;
  subscribe(listener: (state: State) => void): () => void;
}
