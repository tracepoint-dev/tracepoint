import { expect, test } from "@playwright/test";

// The demo's receiver is created with `mcp: true`, so /tracepoint/mcp serves the
// read-only MCP surface. Exercises the whole path: vite middleware -> nodeHandler
// -> createReceiver -> lazy import of ./mcp -> @modelcontextprotocol/sdk.

const HEADERS = {
  "content-type": "application/json",
  accept: "application/json, text/event-stream",
};

const rpc = (method: string, params: unknown, id = 1) =>
  JSON.stringify({ jsonrpc: "2.0", id, method, params });

test("the receiver serves a working MCP endpoint, gated to approved reports", async ({
  request,
  page,
}) => {
  // 1. file a report through the SDK
  const note = `mcp e2e ${Date.now()}`;
  await page.goto("/");
  await page.getByRole("button", { name: "Report an issue" }).click();
  await page.getByTestId("sample-action").click();
  await page.getByPlaceholder("Describe the issue…").fill(note);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/tracepoint/ingest") && r.status() === 201),
    page.getByRole("button", { name: "Send" }).click(),
  ]);

  // 2. MCP handshake works
  const init = await request.post("/tracepoint/mcp", {
    headers: HEADERS,
    data: rpc("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "e2e", version: "0" },
    }),
  });
  expect(init.ok()).toBeTruthy();
  expect((await init.json()).result.serverInfo.name).toBe("tracepoint");

  // 3. while the report is pending, list_reports is empty
  const listPending = await request.post("/tracepoint/mcp", {
    headers: HEADERS,
    data: rpc("tools/call", { name: "list_reports", arguments: {} }, 2),
  });
  const pendingRows = JSON.parse((await listPending.json()).result.content[0].text);
  expect(pendingRows.some((r: { description: string }) => r.description === note)).toBe(false);

  // 4. approve it from the dashboard
  await page.goto("/tracepoint");
  await page.getByRole("link", { name: note }).click();
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.locator(".badge")).toHaveText("approved");

  // 5. now the MCP sees it, and get_report returns the schema-2.0 envelope
  const listApproved = await request.post("/tracepoint/mcp", {
    headers: HEADERS,
    data: rpc("tools/call", { name: "list_reports", arguments: {} }, 3),
  });
  const rows = JSON.parse((await listApproved.json()).result.content[0].text);
  const row = rows.find((r: { description: string }) => r.description === note);
  expect(row).toBeTruthy();

  const got = await request.post("/tracepoint/mcp", {
    headers: HEADERS,
    data: rpc("tools/call", { name: "get_report", arguments: { id: row.id } }, 4),
  });
  const payload = JSON.parse((await got.json()).result.content[0].text);
  expect(payload.tracepoint.schemaVersion).toBe("2.0");
  expect(payload.report.description).toBe(note);
});
