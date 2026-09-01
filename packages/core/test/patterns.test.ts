import { describe, expect, it } from "vitest";
import { redactPatterns } from "../src/privacy/patterns.js";

describe("redactPatterns — hits", () => {
  it("redacts email addresses", () => {
    expect(redactPatterns("mail me at jane.doe+tag@example.co.uk please")).toBe(
      "mail me at «email» please",
    );
  });

  it("redacts a JWT", () => {
    const jwt =
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
    expect(redactPatterns(`token=${jwt}`)).toBe("token=«jwt»");
  });

  it("redacts known provider secret shapes", () => {
    expect(redactPatterns("key sk_live_abcdef0123456789")).toBe("key «token»");
    expect(redactPatterns("gh: ghp_0123456789abcdef0123456789abcdef0123")).toBe("gh: «token»");
    expect(redactPatterns("aws AKIAIOSFODNN7EXAMPLE done")).toBe("aws «token» done");
  });

  it("redacts a Luhn-valid card number, spaced or joined", () => {
    expect(redactPatterns("card 4242 4242 4242 4242 exp")).toBe("card «card» exp");
    expect(redactPatterns("4111111111111111")).toBe("«card»");
  });

  it("redacts an E.164 phone number but keeps the boundary char", () => {
    expect(redactPatterns("call +14155552671 now")).toBe("call «phone» now");
    expect(redactPatterns("(+442071838750)")).toBe("(«phone»)");
  });
});

describe("redactPatterns — false positives it must NOT touch", () => {
  const corpus = [
    "version 4.11.2 shipped",
    "ledger row 1234567890123456 is an id", // 16 digits, Luhn-invalid
    "uuid 550e8400-e29b-41d4-a716-446655440000",
    "the build id is 1234567890",
    "coordinates 37.7749, -122.4194",
    "an ordinary sentence with no secrets in it",
    "path /users/42/orders/1007",
    "hex #E1522A brand colour",
  ];

  for (const line of corpus) {
    it(`leaves "${line}" unchanged`, () => {
      expect(redactPatterns(line)).toBe(line);
    });
  }
});
