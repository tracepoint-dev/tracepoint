/**
 * Redaction applied *before* a screenshot and undone after (ADR 0001 D5).
 * Password fields have their value blanked; everything matched by the default
 * list or the user's `redact` selectors is hidden (visibility only — no reflow).
 */
import { DEFAULT_REDACT } from "../constants.js";

type Restore = () => void;

const PASSWORD_SELECTOR = 'input[type="password"]';

function blankValue(input: HTMLInputElement): Restore {
  const previous = input.value;
  input.value = "";
  return () => {
    input.value = previous;
  };
}

function hide(el: HTMLElement): Restore {
  const previous = el.style.visibility;
  el.style.visibility = "hidden";
  return () => {
    el.style.visibility = previous;
  };
}

/** Run `fn` with sensitive nodes redacted, restoring the DOM afterwards (even on throw). */
export async function withRedaction<T>(userRedact: string[], fn: () => Promise<T>): Promise<T> {
  const restores: Restore[] = [];

  for (const input of document.querySelectorAll<HTMLInputElement>(PASSWORD_SELECTOR)) {
    restores.push(blankValue(input));
  }

  const selectors = [...DEFAULT_REDACT.filter((s) => s !== PASSWORD_SELECTOR), ...userRedact];
  for (const selector of selectors) {
    let matches: NodeListOf<Element>;
    try {
      matches = document.querySelectorAll(selector);
    } catch {
      continue; // ignore an invalid user selector
    }
    for (const el of matches) {
      if (el instanceof HTMLElement) restores.push(hide(el));
    }
  }

  try {
    return await fn();
  } finally {
    for (const restore of restores.reverse()) restore();
  }
}
