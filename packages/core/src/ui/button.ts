import { el } from "./dom.js";

export function createButton(onOpen: () => void): HTMLElement {
  return el(
    "button",
    { class: "tp-fab", type: "button", "aria-label": "Report an issue", onClick: onOpen },
    "Report an issue",
  );
}

export function createHint(text: string): HTMLElement {
  return el("div", { class: "tp-hint", text });
}
