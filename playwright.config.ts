import { defineConfig } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  // the demo mounts one shared file-backed receiver — run specs serially
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm --filter @tracepoint-dev/demo-app dev",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    // Chromium runs the whole suite. Firefox/WebKit only re-run the screenshot
    // fidelity spec — the rest is framework-agnostic server logic that can't vary
    // by engine, and the specs share one file-backed store (not isolation-safe
    // across projects).
    { name: "chromium", use: { browserName: "chromium" } },
    {
      name: "firefox",
      use: { browserName: "firefox" },
      testMatch: /cross-browser-screenshot\.spec\.ts/,
    },
    {
      name: "webkit",
      use: { browserName: "webkit" },
      testMatch: /cross-browser-screenshot\.spec\.ts/,
    },
  ],
});
