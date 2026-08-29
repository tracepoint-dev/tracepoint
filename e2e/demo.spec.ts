import { expect, test } from "@playwright/test";

test("demo app boots and links the workspace packages", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Tracepoint demo" })).toBeVisible();
  await expect(page.getByTestId("core-version")).toHaveText("0.0.0");
  await expect(page.getByTestId("handle-state")).toHaveText("null (stub)");
});
