import { looksAuthoredId } from "./volatile-class.js";

/** Absolute XPath to `el` — the always-resolvable backstop when a CSS selector fails. */
export function xpathOf(el: Element): string {
  if (el.id && looksAuthoredId(el.id)) {
    try {
      if (el.ownerDocument.querySelectorAll(`#${CSS.escape(el.id)}`).length === 1) {
        return `//*[@id=${JSON.stringify(el.id)}]`;
      }
    } catch {
      // fall through to the positional path
    }
  }

  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.nodeType === 1) {
    let index = 1;
    let sib = node.previousElementSibling;
    while (sib) {
      if (sib.tagName === node.tagName) index++;
      sib = sib.previousElementSibling;
    }
    parts.unshift(`${node.tagName.toLowerCase()}[${index}]`);
    node = node.parentElement;
  }
  return `/${parts.join("/")}`;
}
