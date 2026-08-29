import type { NormalizedUi } from "../internal-types.js";
import type { State } from "../state/machine.types.js";
import type { DescriptorBundle, Screenshot } from "../types.js";
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

export interface PanelOptions {
  labels: NormalizedUi["labels"];
  closeIcon: string | null;
}

export interface Panel {
  el: HTMLElement;
  render(state: State, ctx: PanelContext): void;
}

function closeButton(icon: string | null, onClose: () => void): HTMLElement {
  const button = el("button", {
    class: "tp-close",
    type: "button",
    "aria-label": "Close",
    onClick: onClose,
  });
  if (icon?.trimStart().startsWith("<")) button.innerHTML = icon;
  else button.textContent = "×";
  return button;
}

/** The report panel. Plain DOM; each state swaps the panel body. */
export function createPanel(handlers: PanelHandlers, opts: PanelOptions): Panel {
  const root = el("div", { class: "tp-panel" });
  root.style.display = "none";

  function render(state: State, ctx: PanelContext): void {
    clear(root);

    if (state === "idle" || state === "picking") {
      root.style.display = "none";
      return;
    }
    root.style.display = "block";

    const title =
      state === "editing"
        ? opts.labels.title
        : state === "error"
          ? "Couldn’t send"
          : state === "success"
            ? opts.labels.success
            : "";
    if (title) {
      root.append(
        el(
          "div",
          { class: "tp-panel-head" },
          el("h2", { text: title }),
          closeButton(opts.closeIcon, handlers.onClose),
        ),
      );
    }

    if (state === "editing") {
      root.append(editingView(ctx, handlers, opts.labels));
    } else if (state === "submitting") {
      root.append(el("p", { class: "tp-status", text: "Sending…" }));
    } else if (state === "error") {
      root.append(errorView(ctx, handlers, opts.labels));
    } else if (state === "success") {
      root.append(successView(handlers, opts.labels));
    }
  }

  return { el: root, render };
}
