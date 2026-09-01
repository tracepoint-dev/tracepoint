import { describe, expect, it } from "vitest";
import { createTextRedactor } from "../src/privacy/redact-text.js";

describe("createTextRedactor", () => {
  it("is a no-op when neither pii nor a text hook is configured", () => {
    const r = createTextRedactor({ redactPii: false, redactText: null });
    const s = "email a@b.com card 4242 4242 4242 4242";
    expect(r(s)).toBe(s);
  });

  it("applies the PII preset when redactPii is on", () => {
    const r = createTextRedactor({ redactPii: true, redactText: null });
    expect(r("ping a@b.com")).toBe("ping «email»");
  });

  it("runs the PII preset first, then the user hook", () => {
    const r = createTextRedactor({
      redactPii: true,
      redactText: (s) => s.replace(/«email»/g, "[EMAIL]"),
    });
    expect(r("to a@b.com")).toBe("to [EMAIL]");
  });

  it("swallows a throwing user hook and returns the pre-hook value", () => {
    const r = createTextRedactor({
      redactPii: true,
      redactText: () => {
        throw new Error("bad redactor");
      },
    });
    expect(r("a@b.com")).toBe("«email»");
  });
});
