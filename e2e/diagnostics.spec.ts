import { expect, test } from "@playwright/test";

// `?diagnostics` renders <DiagnosticsDemo> with `console` + `network` capture on.
// We assert on the POST body to /tracepoint/ingest directly rather than the dashboard
// (which does not render the diagnostic sections yet).

test("console, errors, network, and target.component land in the payload", async ({ page }) => {
  await page.goto("/?diagnostics");

  await page.getByTestId("log-error").click();
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/tracepoint/does-not-exist")),
    page.getByTestId("bad-fetch").click(),
  ]);

  await page.getByRole("button", { name: "Report an issue" }).click();
  await expect(page.getByText("Click an element to report")).toBeVisible();
  await page.getByTestId("sample-action").click();
  await page.getByPlaceholder("Describe the issue…").fill(`diag ${Date.now()}`);

  const [request] = await Promise.all([
    page.waitForRequest((r) => r.url().includes("/tracepoint/ingest") && r.method() === "POST"),
    page.getByRole("button", { name: "Send" }).click(),
  ]);

  const body = request.postDataJSON() as {
    tracepoint: { schemaVersion: string };
    capture: { console: boolean; network: boolean };
    console: Array<{ level: string; message: string }>;
    errors: Array<{ message: string }>;
    network: Array<{ url: string; status: number | null }>;
    target: { component: { name: string | null; stack: string[] } | null } | null;
  };

  expect(body.tracepoint.schemaVersion).toBe("2.0");
  expect(body.capture).toMatchObject({ console: true, network: true });

  expect(
    body.console.some((e) => e.level === "error" && e.message.includes("kaboom from demo")),
  ).toBe(true);

  expect(body.network.some((e) => e.url.includes("/tracepoint/does-not-exist"))).toBe(true);

  // the webhook POST itself must never be recorded as network activity
  expect(body.network.some((e) => e.url.includes("/tracepoint/ingest"))).toBe(false);

  expect(body.target?.component?.stack).toContain("DiagnosticsDemo");
});

test("the default demo still sends a clean schema-2.0 payload with capture off", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Report an issue" }).click();
  await page.getByTestId("sample-action").click();
  await page.getByPlaceholder("Describe the issue…").fill(`clean ${Date.now()}`);

  const [request] = await Promise.all([
    page.waitForRequest((r) => r.url().includes("/tracepoint/ingest") && r.method() === "POST"),
    page.getByRole("button", { name: "Send" }).click(),
  ]);

  const body = request.postDataJSON() as {
    tracepoint: { schemaVersion: string };
    capture: { console: boolean; network: boolean };
    console: unknown[];
    network: unknown[];
  };

  expect(body.tracepoint.schemaVersion).toBe("2.0");
  expect(body.capture).toEqual({ console: false, network: false, truncated: {} });
  expect(body.console).toEqual([]);
  expect(body.network).toEqual([]);
});
