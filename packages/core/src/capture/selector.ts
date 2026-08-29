import { finder } from "@medv/finder";
import { FINDER_TIMEOUT_MS } from "../constants.js";
import type { SelectorConfidence } from "../internal-types.js";
import { isStableClass, looksAuthoredId } from "./volatile-class.js";

export interface SelectorResult {
  generated: string;
  confidence: SelectorConfidence;
  resolves: boolean;
  matchCount: number;
}

const POSITIONAL = /:nth-(child|of-type)\(/;

/** Build the best CSS selector for `el`, filtering out volatile classes/ids. */
export function generateSelector(el: Element): SelectorResult {
  const authorId = el.id && looksAuthoredId(el.id) ? el.id : null;

  let generated = "";
  try {
    generated = finder(el, {
      className: (n) => isStableClass(n),
      idName: (n) => n === authorId,
      tagName: () => true,
      timeoutMs: FINDER_TIMEOUT_MS,
    });
  } catch {
    generated = "";
  }

  let resolves = false;
  let matchCount = -1;
  if (generated) {
    try {
      const doc = el.ownerDocument;
      matchCount = doc.querySelectorAll(generated).length;
      resolves = doc.querySelector(generated) === el;
    } catch {
      // finder produced something querySelector rejects — treat as unresolved
    }
  }

  const confidence: SelectorConfidence =
    !generated || POSITIONAL.test(generated) ? "positional" : "semantic";

  return { generated, confidence, resolves, matchCount };
}
