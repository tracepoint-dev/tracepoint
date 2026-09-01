/**
 * The shared string redactor (ADR 0004 D5). Composes the opt-in PII preset with
 * the user's `redact.text` hook, in that order. Used by the console collector,
 * the error collector, and app-context preparation, so a value is redacted the
 * same way wherever it appears — and always before it enters a buffer.
 */
import { redactPatterns } from "./patterns.js";

export interface TextRedactorConfig {
  redactPii: boolean;
  redactText: ((value: string) => string) | null;
}

export type TextRedactor = (value: string) => string;

const identity: TextRedactor = (value) => value;

export function createTextRedactor(config: TextRedactorConfig): TextRedactor {
  const { redactPii, redactText } = config;
  if (!redactPii && !redactText) return identity;

  return (value: string): string => {
    let out = value;
    if (redactPii) out = redactPatterns(out);
    if (redactText) {
      try {
        out = redactText(out);
      } catch {
        // a throwing user redactor must not break capture
      }
    }
    return out;
  };
}
