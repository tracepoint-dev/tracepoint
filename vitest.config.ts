import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["packages/*/test/**/*.test.ts", "packages/*/test/**/*.test.tsx"],
    passWithNoTests: false,
  },
});
