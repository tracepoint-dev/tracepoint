import { describe, expect, it } from "vitest";
import { createReceiver } from "../src/index.js";
import { fakeStore } from "./fake-store.js";

const BASE = "http://localhost:3000/tracepoint";

function envelope(description: string, route = "/x") {
  return {
    tracepoint: { schemaVersion: "1.0", sdkVersion: "0.1.0" },
    id: "x",
    createdAt: new Date().toISOString(),
    report: { description, annotations: [] },
    page: { url: `https://app.test${route}`, route, title: "T", referrer: null },
    target: { tag: "button", primarySelector: "#buy", text: "Buy" },
    client: { userAgent: "test", language: "en" },
    context: {},
    screenshot: {
      mimeType: "image/png",
      width: 2,
      height: 2,
      dataUrl: "data:image/png;base64,aGk=",
    },
  };
}

async function seed(r: ReturnType<typeof createReceiver>, ...descriptions: string[]) {
  const ids: string[] = [];
  for (const d of descriptions) {
    const res = await r.handleRequest(
      new Request(`${BASE}/ingest`, { method: "POST", body: JSON.stringify(envelope(d)) }),
    );
    ids.push((await res.json()).id);
  }
  return ids;
}

describe("dashboard", () => {
  it("lists reports at GET /", async () => {
    const r = createReceiver({ store: fakeStore(), dashboard: true });
    await seed(r, "first bug", "second bug");

    const res = await r.handleRequest(new Request(BASE));
    expect(res.headers.get("content-type")).toContain("text/html");
    const body = await res.text();
    expect(body).toContain("first bug");
    expect(body).toContain("second bug");
    expect(body).toContain("/tracepoint/reports/");
  });

  it("renders a detail page with the descriptor and a screenshot route", async () => {
    const r = createReceiver({ store: fakeStore(), dashboard: true });
    const [id] = await seed(r, "checkout broken");

    const detail = await r.handleRequest(new Request(`${BASE}/reports/${id}`));
    const body = await detail.text();
    expect(body).toContain("checkout broken");
    expect(body).toContain("#buy");
    expect(body).toContain(`/reports/${id}/screenshot`);

    const shot = await r.handleRequest(new Request(`${BASE}/reports/${id}/screenshot`));
    expect(shot.headers.get("content-type")).toBe("image/png");
    expect(new TextDecoder().decode(new Uint8Array(await shot.arrayBuffer()))).toBe("hi");
  });

  it("POST delete removes the report and 303s back to the list", async () => {
    const store = fakeStore();
    const r = createReceiver({ store, dashboard: true });
    const [id] = await seed(r, "temp");

    const res = await r.handleRequest(
      new Request(`${BASE}/reports/${id}/delete`, { method: "POST" }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/tracepoint");
    expect(await store.get(id)).toBeNull();
  });

  it("POST /clear empties the store", async () => {
    const store = fakeStore();
    const r = createReceiver({ store, dashboard: true });
    await seed(r, "a", "b", "c");

    const res = await r.handleRequest(new Request(`${BASE}/clear`, { method: "POST" }));
    expect(res.status).toBe(303);
    expect(store.rows.size).toBe(0);
  });

  it("dashboard routes are 404 when dashboard is not enabled", async () => {
    const r = createReceiver({ store: fakeStore() });
    expect((await r.handleRequest(new Request(BASE))).status).toBe(404);
  });

  it("auth guard blocks unauthorised dashboard requests", async () => {
    const r = createReceiver({
      store: fakeStore(),
      dashboard: true,
      auth: (req) => req.headers.get("x-admin") === "secret",
    });
    expect((await r.handleRequest(new Request(BASE))).status).toBe(401);

    const ok = await r.handleRequest(new Request(BASE, { headers: { "x-admin": "secret" } }));
    expect(ok.status).toBe(200);
  });

  // ---------------------------------------------------------------- approval workflow

  function statusForm(status: string): RequestInit {
    return {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: `status=${status}`,
    };
  }

  it("detail page shows the status badge + approve/reject buttons", async () => {
    const r = createReceiver({ store: fakeStore(), dashboard: true });
    const [id] = await seed(r, "triage me");
    const body = await (await r.handleRequest(new Request(`${BASE}/reports/${id}`))).text();
    expect(body).toContain(`/reports/${id}/status`);
    expect(body).toContain("Approve");
    expect(body).toContain("Reject");
    expect(body).toMatch(/badge[^>]*>pending/);
  });

  it("POST /reports/:id/status sets the status and 303s to the detail page", async () => {
    const store = fakeStore();
    const r = createReceiver({ store, dashboard: true });
    const [id] = await seed(r, "approve me");

    const res = await r.handleRequest(
      new Request(`${BASE}/reports/${id}/status`, statusForm("approved")),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`/tracepoint/reports/${id}`);
    expect((await store.get(id))?.status).toBe("approved");

    // flips back
    await r.handleRequest(new Request(`${BASE}/reports/${id}/status`, statusForm("rejected")));
    expect((await store.get(id))?.status).toBe("rejected");
  });

  it("rejects an unknown status value with 400", async () => {
    const store = fakeStore();
    const r = createReceiver({ store, dashboard: true });
    const [id] = await seed(r, "x");
    const res = await r.handleRequest(
      new Request(`${BASE}/reports/${id}/status`, statusForm("bogus")),
    );
    expect(res.status).toBe(400);
    expect((await store.get(id))?.status).toBe("pending");
  });

  it("GET / defaults to the pending queue; ?status= filters", async () => {
    const store = fakeStore();
    const r = createReceiver({ store, dashboard: true });
    const [a] = await seed(r, "alpha", "beta");
    await r.handleRequest(new Request(`${BASE}/reports/${a}/status`, statusForm("approved")));

    const def = await (await r.handleRequest(new Request(BASE))).text();
    expect(def).toContain("beta");
    expect(def).not.toContain("alpha");

    const approved = await (await r.handleRequest(new Request(`${BASE}?status=approved`))).text();
    expect(approved).toContain("alpha");
    expect(approved).not.toContain("beta");

    const all = await (await r.handleRequest(new Request(`${BASE}?status=all`))).text();
    expect(all).toContain("alpha");
    expect(all).toContain("beta");
  });
});
