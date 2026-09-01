/**
 * buildDescriptor(el) — the orchestrator. Synchronous and fast (ADR 0001 D4);
 * the slow async work is the screenshot, handled elsewhere.
 */
import { TEST_ID_ATTRS } from "../constants.js";
import type { DescriptorBundle } from "../types.js";
import { collectAttributes, safeFieldValue } from "./attributes.js";
import { runContributors } from "./contributors.js";
import { accessibleName, findInteractiveAncestor } from "./interactive-ancestor.js";
import { outerHtmlSnippet } from "./outer-html.js";
import { generateSelector } from "./selector.js";
import { isStableClass, looksAuthoredId } from "./volatile-class.js";
import { xpathOf } from "./xpath.js";

function readTestId(el: Element): string | null {
  for (const name of TEST_ID_ATTRS) {
    const value = el.getAttribute(name);
    if (value) return value;
  }
  return null;
}

function readText(el: Element): string {
  const raw = (el as HTMLElement).innerText ?? el.textContent ?? "";
  return raw.replace(/\s+/g, " ").trim().slice(0, 200);
}

function ancestorChain(el: Element): string[] {
  const chain: string[] = [];
  let node = el.parentElement;
  let hops = 0;
  while (node && hops < 3) {
    let descriptor = node.tagName.toLowerCase();
    if (node.id && looksAuthoredId(node.id)) {
      descriptor += `#${node.id}`;
    } else {
      const cls = Array.from(node.classList).find(isStableClass);
      if (cls) descriptor += `.${cls}`;
    }
    chain.push(descriptor);
    node = node.parentElement;
    hops++;
  }
  return chain;
}

function selectorFor(el: Element): string {
  return generateSelector(el).generated || xpathOf(el);
}

export function buildDescriptor(el: Element): DescriptorBundle {
  const testId = readTestId(el);
  const authorId = el.id && looksAuthoredId(el.id) ? el.id : null;
  const selector = generateSelector(el);
  const rect = el.getBoundingClientRect();

  const primarySelector = testId
    ? `[data-testid=${JSON.stringify(testId)}]`
    : selector.generated || xpathOf(el);

  return {
    primarySelector,
    generatedSelector: selector.generated,
    selectorConfidence: selector.confidence,
    selectorResolves: selector.resolves,
    selectorMatchCount: selector.matchCount,
    xpath: xpathOf(el),
    testId,
    id: authorId,
    tag: el.tagName.toLowerCase(),
    attributes: collectAttributes(el),
    value: safeFieldValue(el),
    text: readText(el),
    ariaRole: el.getAttribute("role"),
    accessibleName: accessibleName(el),
    interactiveAncestor: findInteractiveAncestor(el, selectorFor),
    boundingRect: {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
    ancestors: ancestorChain(el),
    outerHtml: outerHtmlSnippet(el),
    component: runContributors(el),
  };
}
