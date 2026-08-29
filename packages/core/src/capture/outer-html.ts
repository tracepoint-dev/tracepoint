const MAX_LEN = 500;
const MAX_ATTR_LEN = 120;

/** Open tag with attributes, children collapsed to `…`. Cheap, high value for AI later. */
export function outerHtmlSnippet(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const attrs = Array.from(el.attributes)
    .map((a) => `${a.name}="${a.value.replace(/"/g, "&quot;").slice(0, MAX_ATTR_LEN)}"`)
    .join(" ");
  const open = attrs ? `<${tag} ${attrs}>` : `<${tag}>`;
  const hasContent = el.children.length > 0 || (el.textContent ?? "").trim().length > 0;
  const snippet = `${open}${hasContent ? "…" : ""}</${tag}>`;
  return snippet.length > MAX_LEN ? `${snippet.slice(0, MAX_LEN)}…` : snippet;
}
