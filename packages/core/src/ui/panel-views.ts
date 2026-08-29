import type { NormalizedUi } from "../internal-types.js";
import { el } from "./dom.js";
import type { PanelContext, PanelHandlers } from "./panel.js";

type Labels = NormalizedUi["labels"];

function screenshotArea(ctx: PanelContext): HTMLElement {
  if (ctx.capturing) return el("div", { class: "tp-shot-empty", text: "Capturing screenshot…" });
  if (ctx.screenshot) {
    return el("img", { class: "tp-shot", src: ctx.screenshot.dataUrl, alt: "screenshot" });
  }
  return el("div", { class: "tp-shot-empty", text: "No screenshot" });
}

function actions(...buttons: HTMLElement[]): HTMLElement {
  return el("div", { class: "tp-row" }, ...buttons);
}
const primary = (label: string, onClick: () => void) =>
  el("button", { class: "tp-btn tp-btn-primary", type: "button", onClick }, label);
const ghost = (label: string, onClick: () => void) =>
  el("button", { class: "tp-btn tp-btn-ghost", type: "button", onClick }, label);

export function editingView(ctx: PanelContext, h: PanelHandlers, labels: Labels): DocumentFragment {
  const frag = document.createDocumentFragment();

  const targetText = ctx.target
    ? `${ctx.target.tag} · ${ctx.target.primarySelector}`
    : "no element";
  const textarea = el("textarea", {
    placeholder: labels.placeholder,
    onInput: (e) => h.onDescription((e.target as HTMLTextAreaElement).value),
  }) as HTMLTextAreaElement;
  textarea.value = ctx.description;

  frag.append(
    el("div", { class: "tp-target", text: targetText }),
    screenshotArea(ctx),
    textarea,
    actions(primary(labels.submit, h.onSubmit), ghost(labels.cancel, h.onCancel)),
  );
  return frag;
}

export function errorView(ctx: PanelContext, h: PanelHandlers, labels: Labels): DocumentFragment {
  const frag = document.createDocumentFragment();
  frag.append(
    el("p", { class: "tp-error", text: ctx.error ?? "Something went wrong." }),
    actions(primary(labels.retry, h.onRetry), ghost(labels.close, h.onClose)),
  );
  return frag;
}

export function successView(h: PanelHandlers, labels: Labels): DocumentFragment {
  const frag = document.createDocumentFragment();
  frag.append(actions(ghost(labels.close, h.onClose)));
  return frag;
}
