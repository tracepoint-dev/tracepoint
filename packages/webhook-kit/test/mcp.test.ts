import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";
import { createReceiver } from "../src/index.js";
import { buildMcpServer } from "../src/mcp/index.js";
import { fakeStore } from "./fake-store.js";

function report(description: string, route = "/x") {
  return {
    payload: {
      tracepoint: { schemaVersion: "2.0", sdkVersion: "0.2.0" },
      createdAt: new Date().toISOString(),
      report: { description, annotations: [] },
      page: { url: `https://app.test${route}`, route },
      target: { tag: "button", text: "Buy" },
    },
    screenshot: {
      mimeType: "image/png",
      width: 2,
      height: 2,
      bytes: new TextEncoder().encode("PNGBYTES"),
    },
  };
}

let openClient: Client | null = null;
afterEach(async () => {
  await openClient?.close();
  openClient = null;
});

async function connect(store: ReturnType<typeof fakeStore>) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await buildMcpServer(store).connect(serverTransport);
  const client = new Client({ name: "test", version: "0" });
  await client.connect(clientTransport);
  openClient = client;
  return client;
}

describe("mcp — tool surface", () => {
  it("exposes exactly the three read tools + the guide resource", async () => {
    const client = await connect(fakeStore());

    const tools = (await client.listTools()).tools.map((t) => t.name).sort();
    expect(tools).toEqual(["get_report", "get_screenshot", "list_reports"]);

    const resources = (await client.listResources()).resources.map((r) => r.uri);
    expect(resources).toContain("tracepoint://guide");

    const guide = await client.readResource({ uri: "tracepoint://guide" });
    expect(guide.contents[0]?.text).toContain("Acting on a Tracepoint report");
  });

  it("list_reports returns only approved reports", async () => {
    const store = fakeStore();
    const { id: approved } = await store.save(report("approved bug"));
    await store.save(report("pending bug"));
    await store.setStatus(approved, "approved");

    const client = await connect(store);
    const res = await client.callTool({ name: "list_reports", arguments: {} });
    const rows = JSON.parse((res.content as { text: string }[])[0].text);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: approved, status: "approved" });
  });

  it("get_report returns an approved payload and refuses non-approved ids", async () => {
    const store = fakeStore();
    const { id: approved } = await store.save(report("fix me"));
    const { id: pending } = await store.save(report("later"));
    await store.setStatus(approved, "approved");

    const client = await connect(store);

    const ok = await client.callTool({ name: "get_report", arguments: { id: approved } });
    expect(ok.isError).toBeFalsy();
    expect(JSON.parse((ok.content as { text: string }[])[0].text).report.description).toBe(
      "fix me",
    );

    const denied = await client.callTool({ name: "get_report", arguments: { id: pending } });
    expect(denied.isError).toBe(true);
    expect((denied.content as { text: string }[])[0].text).toContain("no approved report");

    const missing = await client.callTool({ name: "get_report", arguments: { id: "nope" } });
    expect(missing.isError).toBe(true);
  });

  it("get_screenshot returns image bytes for an approved report", async () => {
    const store = fakeStore();
    const { id } = await store.save(report("shot"));
    await store.setStatus(id, "approved");

    const client = await connect(store);
    const res = await client.callTool({ name: "get_screenshot", arguments: { id } });
    const part = (res.content as Array<{ type: string; data?: string; mimeType?: string }>)[0];
    expect(part.type).toBe("image");
    expect(part.mimeType).toBe("image/png");
    expect(Buffer.from(part.data ?? "", "base64").toString()).toBe("PNGBYTES");
  });
});

describe("mcp — receiver route", () => {
  const BASE = "http://localhost:3000/tracepoint";
  const initBody = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "test", version: "0" },
    },
  });
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };

  it("serves an MCP endpoint at /mcp when mcp: true", async () => {
    const r = createReceiver({ store: fakeStore(), mcp: true });
    const res = await r.handleRequest(
      new Request(`${BASE}/mcp`, { method: "POST", headers, body: initBody }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.result.serverInfo.name).toBe("tracepoint");
    expect(json.result.capabilities.tools).toBeDefined();
  });

  it("404s /mcp when mcp is not enabled", async () => {
    const r = createReceiver({ store: fakeStore() });
    const res = await r.handleRequest(
      new Request(`${BASE}/mcp`, { method: "POST", headers, body: initBody }),
    );
    expect(res.status).toBe(404);
  });

  it("is guarded by auth", async () => {
    const r = createReceiver({
      store: fakeStore(),
      mcp: true,
      auth: (req) => req.headers.get("x-key") === "s3cret",
    });
    const denied = await r.handleRequest(
      new Request(`${BASE}/mcp`, { method: "POST", headers, body: initBody }),
    );
    expect(denied.status).toBe(401);

    const ok = await r.handleRequest(
      new Request(`${BASE}/mcp`, {
        method: "POST",
        headers: { ...headers, "x-key": "s3cret" },
        body: initBody,
      }),
    );
    expect(ok.status).toBe(200);
  });
});
