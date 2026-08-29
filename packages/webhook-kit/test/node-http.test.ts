import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createReceiver } from "../src/index.js";
import { nodeHandler } from "../src/node-http.js";
import { fakeStore } from "./fake-store.js";

let server: ReturnType<typeof createServer>;
let origin: string;

beforeEach(async () => {
  const receiver = createReceiver({ store: fakeStore(), dashboard: true, basePath: "/tp" });
  const handle = nodeHandler(receiver);
  server = createServer((req, res) => {
    if (req.url?.startsWith("/tp")) handle(req, res);
    else {
      res.statusCode = 200;
      res.end("app");
    }
  });
  await new Promise<void>((r) => server.listen(0, r));
  origin = `http://localhost:${(server.address() as AddressInfo).port}`;
});

afterEach(() => new Promise<void>((r) => server.close(() => r())));

describe("nodeHandler", () => {
  it("bridges a real http request/response to the receiver", async () => {
    const ingest = await fetch(`${origin}/tp/ingest`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        createdAt: "2026-08-30T00:00:00.000Z",
        report: { description: "over http" },
        page: { route: "/x" },
      }),
    });
    expect(ingest.status).toBe(201);

    const dash = await fetch(`${origin}/tp`);
    expect(dash.headers.get("content-type")).toContain("text/html");
    expect(await dash.text()).toContain("over http");
  });

  it("leaves non-prefixed routes to the app", async () => {
    expect(await (await fetch(`${origin}/`)).text()).toBe("app");
  });
});
