import { el } from "./dom.js";

export interface Highlight {
  el: HTMLElement;
  show(rect: DOMRect): void;
  hide(): void;
}

/** The orange overlay that follows the pointer during pick mode. */
export function createHighlight(): Highlight {
  const box = el("div", { class: "tp-highlight" });
  box.style.display = "none";

  return {
    el: box,
    show(rect) {
      box.style.display = "block";
      box.style.left = `${rect.left}px`;
      box.style.top = `${rect.top}px`;
      box.style.width = `${rect.width}px`;
      box.style.height = `${rect.height}px`;
    },
    hide() {
      box.style.display = "none";
    },
  };
}
