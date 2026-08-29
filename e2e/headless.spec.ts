import { expect, test } from "@playwright/test";

test("headless: custom UI drives pick → screenshot → send, lands in the dashboard", async ({
  page,
}) => {
  await page.goto("/?headless");

  // headless mounts no built-in UI at all
  await expect(page.locator("#tracepoint-root")).toHaveCount(0);

  await page.getByTestId("headless-report").click();
  await expect(page.getByTestId("headless-status")).toHaveText("picking");
  await page.getByTestId("sample-action").click();

  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/__tp/ingest") && r.status() === 201),
    expect(page.getByTestId("headless-status")).toHaveText("sent"),
  ]);

  await page.goto("/__tp");
  await expect(page.getByRole("link", { name: "headless report" })).toBeVisible();
});
