import { describe, expect, it } from "vitest";
import { SENSITIVE_URL_PARAMS } from "../src/constants.js";
import { cleanUrl } from "../src/privacy/url.js";

const params = [...SENSITIVE_URL_PARAMS];

describe("cleanUrl", () => {
  it("leaves a URL with no query untouched", () => {
    expect(cleanUrl("https://api.test/users", params)).toBe("https://api.test/users");
  });

  it("scrubs the value of a sensitive key but keeps the key", () => {
    const out = cleanUrl("https://api.test/cb?token=abc123&page=2", params);
    expect(out).toContain("token=REDACTED");
    expect(out).toContain("page=2");
    expect(out).not.toContain("abc123");
  });

  it("is case-insensitive on the key", () => {
    expect(cleanUrl("https://api.test/x?ACCESS_TOKEN=zzz", params)).toContain(
      "ACCESS_TOKEN=REDACTED",
    );
  });

  it("honours extra params passed in", () => {
    const out = cleanUrl("https://api.test/x?tenant=acme&q=1", [...params, "tenant"]);
    expect(out).toContain("tenant=REDACTED");
    expect(out).toContain("q=1");
  });

  it("preserves a path-only URL form", () => {
    const out = cleanUrl("/api/cb?code=secret&ok=1", params);
    expect(out.startsWith("/api/cb?")).toBe(true);
    expect(out).toContain("code=REDACTED");
  });

  it("returns the input unchanged when there is nothing sensitive", () => {
    const raw = "https://api.test/x?a=1&b=2";
    expect(cleanUrl(raw, params)).toBe(raw);
  });

  it("does not throw on a malformed URL", () => {
    expect(cleanUrl("::::not a url::::", params)).toBe("::::not a url::::");
  });
});
