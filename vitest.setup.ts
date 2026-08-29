/**
 * Test-only environment shims. Real browsers provide these; jsdom does not always.
 */

// jsdom throws on `<canvas>.getContext()` without the native `canvas` package.
// Return null instead so canvas code can feature-detect. Real rendering is
// exercised in Playwright, not here.
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = (() =>
    null) as typeof HTMLCanvasElement.prototype.getContext;
}

// jsdom (as run under Vitest) is missing the `CSS` namespace object. `@medv/finder`
// calls `CSS.escape()`, so provide the canonical polyfill.
type CssShim = { escape: (value: string) => string };
const g = globalThis as typeof globalThis & { CSS?: Partial<CssShim> };

if (!g.CSS) g.CSS = {};

if (typeof g.CSS.escape !== "function") {
  g.CSS.escape = (value: string): string => {
    const str = String(value);
    const length = str.length;
    const firstCodeUnit = str.charCodeAt(0);
    let result = "";
    let index = -1;

    while (++index < length) {
      const codeUnit = str.charCodeAt(index);

      if (codeUnit === 0x0000) {
        result += "�";
        continue;
      }

      const isControl = (codeUnit >= 0x0001 && codeUnit <= 0x001f) || codeUnit === 0x007f;
      const leadingDigit = index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039;
      const digitAfterDash =
        index === 1 && codeUnit >= 0x0030 && codeUnit <= 0x0039 && firstCodeUnit === 0x002d;

      if (isControl || leadingDigit || digitAfterDash) {
        result += `\\${codeUnit.toString(16)} `;
        continue;
      }

      if (index === 0 && length === 1 && codeUnit === 0x002d) {
        result += `\\${str.charAt(index)}`;
        continue;
      }

      const isSafe =
        codeUnit >= 0x0080 ||
        codeUnit === 0x002d ||
        codeUnit === 0x005f ||
        (codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
        (codeUnit >= 0x0041 && codeUnit <= 0x005a) ||
        (codeUnit >= 0x0061 && codeUnit <= 0x007a);

      result += isSafe ? str.charAt(index) : `\\${str.charAt(index)}`;
    }

    return result;
  };
}
