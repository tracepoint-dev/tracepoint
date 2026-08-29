import { describe, expect, it } from "vitest";
import { toDiscordMessage } from "../src/index.js";

describe("@tracepoint-dev/connector-discord", () => {
  it("toDiscordMessage() throws until the M3 formatter lands", () => {
    expect(() =>
      toDiscordMessage({
        report: { description: "button does nothing" },
        page: { url: "https://example.test/app" },
      }),
    ).toThrow(/M3/);
  });
});
