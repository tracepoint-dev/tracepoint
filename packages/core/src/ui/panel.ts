import type { DescriptorBundle, Screenshot } from "../internal-types.js";
import type { State } from "../state/machine.types.js";
import { clear, el } from "./dom.js";
import { editingView, errorView, successView } from "./panel-views.js";

export interface PanelContext {
  target: DescriptorBundle | null;
  screenshot: Screenshot | null;
  capturing: boolean;
  error: string | null;
  description: string;
}

export interface PanelHandlers {
  onDescription(text: string): void;
  onSubmit(): void;
  onCancel(): void;
  onRetry(): void;
  onClose(): void;
}

export interface Panel {
  el: HTMLElement;
  render(state: State, ctx: PanelContext): void;
}

/** The report panel. Plain DOM; each state swaps the panel body. */
export function createPanel(handlers: PanelHandlers): Panel {
  const root = el("div", { class: "tp-panel" });
  root.style.display = "none";

  function render(state: State, ctx: PanelContext): void {
    clear(root);

    if (state === "idle" || state === "picking") {
      root.style.display = "none";
      return;
    }
    root.style.display = "block";

    if (state === "editing") {
      root.append(editingView(ctx, handlers));
    } else if (state === "submitting") {
      root.append(el("p", { class: "tp-status", text: "Sending…" }));
    } else if (state === "error") {
      root.append(errorView(ctx, handlers));
    } else if (state === "success") {
      root.append(successView(handlers));
    }
  }

  return { el: root, render };
}
