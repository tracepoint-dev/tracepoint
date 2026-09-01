/**
 * PII / secret patterns for the opt-in `redact.pii` preset (ADR 0004 D5).
 *
 * Deliberately narrow — high-signal shapes only — so it does not mangle version
 * strings, UUIDs, or ordinary prose. Widen only with a false-positive corpus in
 * hand. No look-behind anywhere: iOS Safari 15 (a support target) rejects it at
 * compile time.
 */

const EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

const JWT = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;

/** Known provider secret shapes: Stripe, GitHub, Slack, AWS access key id. */
const KNOWN_TOKEN =
  /\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{10,}\b|\bgh[pousr]_[A-Za-z0-9]{20,}\b|\bxox[baprs]-[A-Za-z0-9-]{10,}\b|\bAKIA[0-9A-Z]{16}\b/g;

/**
 * 13–19 digits, optionally split by single spaces/dashes — Luhn-checked below.
 * Written so it can never end on a separator (would otherwise eat a trailing space).
 */
const CARD_CANDIDATE = /\b\d(?:[ -]?\d){12,18}\b/g;

/** E.164 phone, anchored to a boundary char via a capture group (no look-behind). */
const PHONE_E164 = /(^|[\s(:=,;])(\+\d{7,15})\b/g;

function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Replace recognised PII / secrets in `input` with `«tag»` placeholders. */
export function redactPatterns(input: string): string {
  let out = input.replace(EMAIL, "«email»").replace(JWT, "«jwt»").replace(KNOWN_TOKEN, "«token»");

  out = out.replace(CARD_CANDIDATE, (match) => {
    const digits = match.replace(/\D/g, "");
    return digits.length >= 13 && digits.length <= 19 && luhnValid(digits) ? "«card»" : match;
  });

  out = out.replace(PHONE_E164, (_m, pre: string) => `${pre}«phone»`);
  return out;
}
