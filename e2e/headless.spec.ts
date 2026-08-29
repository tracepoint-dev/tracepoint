import { expect, test } from "@playwright/test";

test("headless: custom UI drives pick → screenshot → send", async ({ page }) => {
  await page.route("**/__tp_hook", (route) => route.fulfill({ status: 200, body: "ok" }));

  await page.goto("/?headless");

  // headless mounts no built-in UI at all
  await expect(page.locator("#tracepoint-root")).toHaveCount(0);

  await page.getByTestId("headless-report").click();
  await expect(page.getByTestId("headless-status")).toHaveText("picking");

  await page.getByTestId("sample-action").click();

  const [request] = await Promise.all([
    page.waitForRequest("**/__tp_hook"),
    expect(page.getByTestId("headless-status")).toHaveText("sent"),
  ]);

  const body = request.postDataJSON();
  expect(body.report.description).toBe("headless report");
  expect(body.target.tag).toBe("button");
});
