import { ATTR_ALLOW, SENSITIVE_INPUT_TYPES, TEST_ID_ATTRS } from "../constants.js";

const MAX_ATTR_LEN = 300;

/** Copy only allow-listed attributes (+ `data-test*` + `aria-*`). Never blanket `data-*`. */
export function collectAttributes(el: Element): Record<string, string> {
  const out: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name;
    const allowed =
      ATTR_ALLOW.includes(name) || TEST_ID_ATTRS.includes(name) || name.startsWith("aria-");
    if (allowed) out[name] = attr.value.slice(0, MAX_ATTR_LEN);
  }
  return out;
}

/** Field value — `null` for non-fields and for password / hidden / credit-card inputs. */
export function safeFieldValue(el: Element): string | null {
  const isField =
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement;
  if (!isField) return null;

  if (el instanceof HTMLInputElement) {
    if (SENSITIVE_INPUT_TYPES.includes(el.type.toLowerCase())) return null;
    if ((el.getAttribute("autocomplete") ?? "").toLowerCase().startsWith("cc-")) return null;
  }
  return el.value.slice(0, MAX_ATTR_LEN);
}
