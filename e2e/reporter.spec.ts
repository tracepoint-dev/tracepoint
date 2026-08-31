import { expect, test } from "@playwright/test";

// A real @tracepoint-dev/webhook-kit receiver is mounted at /tracepoint by the demo's
// vite config (file store + dashboard). These specs drive the whole loop.

test("button → pick → describe → submit → appears in the dashboard → delete", async ({ page }) => {
  const note = `nav is broken ${Date.now()}`;
  await page.goto("/");

  await page.getByRole("button", { name: "Report an issue" }).click();
  await expect(page.getByText("Click an element to report")).toBeVisible();
  await page.getByTestId("sample-action").click();

  await expect(page.getByRole("heading", { name: "Report an issue" })).toBeVisible();
  await page.getByPlaceholder("Describe the issue…").fill(note);

  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/tracepoint/ingest") && r.status() === 201),
    page.getByRole("button", { name: "Send" }).click(),
  ]);
  await expect(page.getByText("Sent — thanks")).toBeVisible();

  // dashboard shows it
  await page.goto("/tracepoint");
  await expect(page.getByRole("link", { name: note })).toBeVisible();

  // detail page has the description, the descriptor section, and the screenshot
  await page.getByRole("link", { name: note }).click();
  await expect(page.getByRole("heading", { level: 1, name: note })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Target" })).toBeVisible();
  await expect(page.locator("img[src*='/screenshot']").first()).toBeVisible();

  // delete it
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page).toHaveURL(/\/tracepoint\/?$/);
  await expect(page.getByRole("link", { name: note })).toHaveCount(0);
});

test("Esc cancels pick mode", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Report an issue" }).click();
  await expect(page.getByText("Click an element to report")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByText("Click an element to report")).toBeHidden();
  await expect(page.getByRole("button", { name: "Report an issue" })).toBeVisible();
});
