import { el } from "./dom.js";
import type { PanelContext, PanelHandlers } from "./panel.js";

function screenshotArea(ctx: PanelContext): HTMLElement {
  if (ctx.capturing) return el("div", { class: "tp-shot-empty", text: "Capturing screenshot…" });
  if (ctx.screenshot) {
    return el("img", { class: "tp-shot", src: ctx.screenshot.dataUrl, alt: "screenshot" });
  }
  return el("div", { class: "tp-shot-empty", text: "No screenshot" });
}

export function editingView(ctx: PanelContext, h: PanelHandlers): DocumentFragment {
  const frag = document.createDocumentFragment();

  const targetText = ctx.target
    ? `${ctx.target.tag} · ${ctx.target.primarySelector}`
    : "no element";
  const textarea = el("textarea", {
    placeholder: "Describe the issue…",
    onInput: (e) => h.onDescription((e.target as HTMLTextAreaElement).value),
  }) as HTMLTextAreaElement;
  textarea.value = ctx.description;

  frag.append(
    el("h2", { text: "Report an issue" }),
    el("div", { class: "tp-target", text: targetText }),
    screenshotArea(ctx),
    textarea,
    el(
      "div",
      { class: "tp-row" },
      el("button", { class: "tp-btn tp-btn-primary", type: "button", onClick: h.onSubmit }, "Send"),
      el("button", { class: "tp-btn tp-btn-ghost", type: "button", onClick: h.onCancel }, "Cancel"),
    ),
  );
  return frag;
}

export function errorView(ctx: PanelContext, h: PanelHandlers): DocumentFragment {
  const frag = document.createDocumentFragment();
  frag.append(
    el("h2", { text: "Couldn’t send" }),
    el("p", { class: "tp-error", text: ctx.error ?? "Something went wrong." }),
    el(
      "div",
      { class: "tp-row" },
      el("button", { class: "tp-btn tp-btn-primary", type: "button", onClick: h.onRetry }, "Retry"),
      el("button", { class: "tp-btn tp-btn-ghost", type: "button", onClick: h.onClose }, "Close"),
    ),
  );
  return frag;
}

export function successView(h: PanelHandlers): DocumentFragment {
  const frag = document.createDocumentFragment();
  frag.append(
    el("h2", { text: "Sent — thanks" }),
    el(
      "div",
      { class: "tp-row" },
      el("button", { class: "tp-btn tp-btn-ghost", type: "button", onClick: h.onClose }, "Close"),
    ),
  );
  return frag;
}
