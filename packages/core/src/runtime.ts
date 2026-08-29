/**
 * The coordinator: owns the draft, wires the state machine to the pipeline and
 * the UI, and runs each effect the reducer asks for (ADR 0001).
 */
import { drawSelectionRect } from "./annotate/selection-rect.js";
import { buildDescriptor } from "./capture/descriptor.js";
import { createPicker } from "./capture/picker.js";
import type { Draft, NormalizedConfig } from "./internal-types.js";
import { assemblePayload } from "./payload/assemble.js";
import { withRedaction } from "./privacy/redact.js";
import { captureScreenshot } from "./screenshot/capture.js";
import { createMachine } from "./state/machine.js";
import type { Effect } from "./state/machine.types.js";
import { createConsoleTransport } from "./transport/console.js";
import type { Transport } from "./transport/types.js";
import { createWebhookTransport } from "./transport/webhook.js";
import type { TracepointHandle } from "./types.js";
import { createButton, createHint } from "./ui/button.js";
import { createHighlight } from "./ui/highlight.js";
import { mountShell } from "./ui/mount.js";
import { createPanel } from "./ui/panel.js";

const emptyDraft = (): Draft => ({
  description: "",
  target: null,
  screenshot: null,
  annotations: [],
});

export function createRuntime(config: NormalizedConfig): TracepointHandle {
  const context: Record<string, unknown> = { ...config.context };
  const transport: Transport = config.webhook
    ? createWebhookTransport(config.webhook)
    : createConsoleTransport();

  let draft = emptyDraft();
  let capturing = false;
  let lastError: string | null = null;
  let hint: HTMLElement | null = null;

  const shell = mountShell();
  const highlight = createHighlight();
  shell.shadow.append(highlight.el);

  const panel = createPanel({
    onDescription: (text) => {
      draft.description = text;
    },
    onSubmit: () => machine.dispatch({ type: "SUBMIT" }),
    onCancel: () => machine.dispatch({ type: "CANCEL" }),
    onRetry: () => machine.dispatch({ type: "RETRY" }),
    onClose: () => machine.dispatch({ type: "CLOSE" }),
  });
  shell.shadow.append(panel.el);

  if (config.button) {
    shell.shadow.append(createButton(() => machine.dispatch({ type: "OPEN" })));
  }

  const picker = createPicker({
    host: shell.host,
    onHover: (el) => highlight.show(el.getBoundingClientRect()),
    onPick: (el) => machine.dispatch({ type: "PICK", element: el }),
    onCancel: () => machine.dispatch({ type: "CANCEL" }),
  });

  const renderPanel = (): void => {
    panel.render(machine.getState(), {
      target: draft.target,
      screenshot: draft.screenshot,
      capturing,
      error: lastError,
      description: draft.description,
    });
  };

  const showHint = (): void => {
    if (hint) return;
    hint = createHint("Click an element to report · Esc to cancel");
    shell.shadow.append(hint);
  };
  const hideHint = (): void => {
    hint?.remove();
    hint = null;
  };

  async function runScreenshot(): Promise<void> {
    capturing = true;
    renderPanel();

    let shot = await withRedaction(config.redact, () => captureScreenshot());
    if (shot && draft.target) {
      shot = await drawSelectionRect(shot, draft.target.boundingRect);
      draft.annotations = [{ type: "selection-rect", rect: draft.target.boundingRect }];
    }
    draft.screenshot = shot;

    capturing = false;
    renderPanel();
  }

  async function runSubmit(): Promise<void> {
    const result = await transport.submit(assemblePayload(draft, context));
    if (result.ok) {
      machine.dispatch({ type: "SUBMIT_OK" });
    } else {
      lastError = result.error ?? (result.status ? `HTTP ${result.status}` : "network error");
      machine.dispatch({ type: "SUBMIT_ERR" });
    }
  }

  function runEffect(effect: Effect): void {
    switch (effect.type) {
      case "startPicking":
        showHint();
        picker.start();
        break;
      case "stopPicking":
        hideHint();
        highlight.hide();
        picker.stop();
        break;
      case "buildDescriptor":
        draft.target = buildDescriptor(effect.element);
        break;
      case "startScreenshot":
        void runScreenshot();
        break;
      case "sendPayload":
        void runSubmit();
        break;
      case "resetDraft":
        draft = emptyDraft();
        capturing = false;
        lastError = null;
        break;
    }
  }

  const machine = createMachine(runEffect);
  machine.subscribe(renderPanel);

  return {
    open: () => machine.dispatch({ type: "OPEN" }),
    close: () => {
      machine.dispatch({ type: machine.getState() === "picking" ? "CANCEL" : "CLOSE" });
    },
    setContext: (patch) => {
      Object.assign(context, patch);
    },
    destroy: () => {
      picker.stop();
      hideHint();
      shell.destroy();
    },
  };
}
