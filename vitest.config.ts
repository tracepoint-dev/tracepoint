import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["packages/*/test/**/*.test.ts", "packages/*/test/**/*.test.tsx"],
    passWithNoTests: false,
  },
});
