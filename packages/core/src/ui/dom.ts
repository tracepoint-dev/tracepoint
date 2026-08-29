/** Tiny DOM builder — no framework, no virtual DOM (ADR 0001 D1). */

type Handler = (event: Event) => void;
type Prop = string | number | boolean | Handler;

/** `el("button", { class: "x", onClick: fn }, "label")` */
export function el(
  tag: string,
  props: Record<string, Prop> = {},
  ...children: Array<Node | string>
): HTMLElement {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "class") {
      node.className = String(value);
    } else if (key === "text") {
      node.textContent = String(value);
    } else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value as Handler);
    } else if (typeof value === "boolean") {
      if (value) node.setAttribute(key, "");
    } else {
      node.setAttribute(key, String(value));
    }
  }
  for (const child of children) node.append(child);
  return node;
}

export function clear(node: Node): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}
