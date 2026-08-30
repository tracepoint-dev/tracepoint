import { expect, test } from "@playwright/test";

// Phase 0 debt: `modern-screenshot` was only ever proven on Chromium. This spec
// runs on all three engines (see playwright.config.ts projects) and checks that
// the DOM rasterisation actually produced a non-blank image — not just that an
// <img> rendered. WebKit here is the closest local proxy for Safari.

type Shot = { mimeType: string; dataUrl: string; width: number; height: number };

test("capture produces a non-blank screenshot", async ({ page }, testInfo) => {
  const note = `xbrowser ${testInfo.project.name} ${Date.now()}`;

  const ingest = page.waitForRequest(
    (r) => r.url().includes("/__tp/ingest") && r.method() === "POST",
  );

  await page.goto("/");
  await page.getByRole("button", { name: "Report an issue" }).click();
  await expect(page.getByText("Click an element to report")).toBeVisible();
  await page.getByTestId("sample-action").click();

  await expect(page.getByRole("heading", { name: "Report an issue" })).toBeVisible();
  await page.getByPlaceholder("Describe the issue…").fill(note);

  const [req] = await Promise.all([
    ingest,
    page.waitForResponse((r) => r.url().includes("/__tp/ingest") && r.status() === 201),
    page.getByRole("button", { name: "Send" }).click(),
  ]);

  const payload = JSON.parse(req.postData() ?? "{}") as { screenshot: Shot | null };
  const shot = payload.screenshot;

  // 1. a screenshot was attached at all
  expect(shot, "screenshot should not be null").not.toBeNull();
  if (!shot) return;

  // 2. shape is sane
  expect(shot.mimeType).toBe("image/png");
  expect(shot.dataUrl.startsWith("data:image/png;base64,")).toBe(true);
  expect(shot.width).toBeGreaterThanOrEqual(300);
  expect(shot.height).toBeGreaterThanOrEqual(300);

  // 3. payload weight — a blank/failed same-colour PNG of this size is < ~2 KB
  const b64 = shot.dataUrl.slice(shot.dataUrl.indexOf(",") + 1);
  const bytes = Math.floor((b64.length * 3) / 4);
  expect(bytes, "PNG byte size").toBeGreaterThan(4000);

  // 4. actual pixels — decode in-page, sample a grid, count distinct colours.
  //    The demo page is white with black headings, body text and a button,
  //    so a faithful capture has many; a blank/transparent one has 1.
  const distinctColours = await page.evaluate(async (dataUrl) => {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return -1;
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const seen = new Set<string>();
    const stepX = Math.max(1, Math.floor(canvas.width / 60));
    const stepY = Math.max(1, Math.floor(canvas.height / 60));
    for (let y = 0; y < canvas.height; y += stepY) {
      for (let x = 0; x < canvas.width; x += stepX) {
        const i = (y * canvas.width + x) * 4;
        seen.add(`${data[i]},${data[i + 1]},${data[i + 2]},${data[i + 3]}`);
      }
    }
    return seen.size;
  }, shot.dataUrl);

  expect(distinctColours, "distinct sampled colours (1 = blank capture)").toBeGreaterThan(5);
});
