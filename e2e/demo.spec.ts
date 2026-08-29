import { expect, test } from "@playwright/test";

test("demo app boots and links @tracepoint-dev/core", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Tracepoint demo" })).toBeVisible();
  await expect(page.getByTestId("core-version")).toHaveText("0.0.0");
  await expect(page.getByRole("button", { name: "Report an issue" })).toBeVisible();
});
