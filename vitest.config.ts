import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["packages/*/test/**/*.test.ts", "packages/*/test/**/*.test.tsx"],
    // webhook-kit is a server package — run its tests in node, not jsdom
    environmentMatchGlobs: [["packages/webhook-kit/**", "node"]],
    passWithNoTests: false,
  },
});
