import type { DescriptorBundle } from "../types.js";

const INTERACTIVE =
  'button, a[href], input, select, textarea, [role="button"], [role="link"], ' +
  '[role="tab"], [role="menuitem"], [role="checkbox"], [role="radio"], ' +
  '[tabindex]:not([tabindex="-1"])';

const MAX_HOPS = 6;

type Ancestor = NonNullable<DescriptorBundle["interactiveAncestor"]>;

/**
 * Walk up from `el` to the nearest interactive element. Returns `null` if `el`
 * itself is interactive (then the picked node already is the target) or none is found.
 */
export function findInteractiveAncestor(
  el: Element,
  selectorFor: (e: Element) => string,
): Ancestor | null {
  let node = el.parentElement;
  let hops = 0;
  while (node && hops < MAX_HOPS) {
    if (node.matches(INTERACTIVE)) {
      return {
        selector: selectorFor(node),
        tag: node.tagName.toLowerCase(),
        role: node.getAttribute("role"),
      };
    }
    node = node.parentElement;
    hops++;
  }
  return null;
}

/** A pragmatic accessible-name resolution (not the full ARIA spec). */
export function accessibleName(el: Element): string | null {
  const label = el.getAttribute("aria-label");
  if (label?.trim()) return label.trim();

  const labelledby = el.getAttribute("aria-labelledby");
  if (labelledby) {
    const text = labelledby
      .split(/\s+/)
      .map((id) => el.ownerDocument.getElementById(id)?.textContent ?? "")
      .join(" ")
      .trim();
    if (text) return text;
  }

  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLSelectElement ||
    el instanceof HTMLTextAreaElement
  ) {
    const fromLabels = Array.from(el.labels ?? [])
      .map((l) => l.textContent ?? "")
      .join(" ")
      .trim();
    if (fromLabels) return fromLabels;
    const placeholder = el.getAttribute("placeholder");
    if (placeholder?.trim()) return placeholder.trim();
  }

  const title = el.getAttribute("title");
  if (title?.trim()) return title.trim();

  const text = ((el as HTMLElement).innerText ?? el.textContent ?? "").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, 120) : null;
}
