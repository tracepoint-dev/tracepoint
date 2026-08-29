import { expect, test } from "@playwright/test";

test("button → pick element → describe → submit → success", async ({ page }) => {
  await page.route("**/__tp_hook", (route) => route.fulfill({ status: 200, body: "ok" }));

  await page.goto("/");

  await page.getByRole("button", { name: "Report an issue" }).click();
  await expect(page.getByText("Click an element to report")).toBeVisible();

  await page.getByTestId("sample-action").click();

  await expect(page.getByRole("heading", { name: "Report an issue" })).toBeVisible();
  await page.getByPlaceholder("Describe the issue…").fill("button does nothing");

  const [request] = await Promise.all([
    page.waitForRequest("**/__tp_hook"),
    page.getByRole("button", { name: "Send" }).click(),
  ]);

  const body = request.postDataJSON();
  expect(body.tracepoint.schemaVersion).toBe("1.0");
  expect(body.report.description).toBe("button does nothing");
  expect(body.target.tag).toBe("button");
  expect(body.page.url).toContain("/");

  await expect(page.getByText("Sent — thanks")).toBeVisible();
});

test("Esc cancels pick mode", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Report an issue" }).click();
  await expect(page.getByText("Click an element to report")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByText("Click an element to report")).toBeHidden();
  await expect(page.getByRole("button", { name: "Report an issue" })).toBeVisible();
});
