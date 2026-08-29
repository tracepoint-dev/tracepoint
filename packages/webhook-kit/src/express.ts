/**
 * Express glue — convert Express req/res to a Web `Request` and back.
 * `import { mount } from "@tracepoint-dev/webhook-kit/express"`.
 */
import type { Receiver } from "./types.js";

// Minimal structural types so this file needs no `express` dependency.
interface ExpressReq {
  method: string;
  originalUrl: string;
  headers: Record<string, string | string[] | undefined>;
  protocol: string;
  get(name: string): string | undefined;
  on(event: "data" | "end", cb: (chunk?: Buffer) => void): void;
}
interface ExpressRes {
  status(code: number): ExpressRes;
  set(field: string, value: string): ExpressRes;
  send(body: string | Buffer): void;
}
type Next = (err?: unknown) => void;

function toRequest(req: ExpressReq): Promise<Request> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => c && chunks.push(c));
    req.on("end", () => {
      const host = req.get("host") ?? "localhost";
      const url = `${req.protocol}://${host}${req.originalUrl}`;
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (typeof v === "string") headers.set(k, v);
        else if (Array.isArray(v)) headers.set(k, v.join(", "));
      }
      const hasBody = req.method !== "GET" && req.method !== "HEAD";
      resolve(
        new Request(url, {
          method: req.method,
          headers,
          body: hasBody && chunks.length ? Buffer.concat(chunks) : undefined,
        }),
      );
    });
  });
}

/** Returns an Express middleware that serves the receiver. */
export function mount(receiver: Receiver) {
  return (req: ExpressReq, res: ExpressRes, next: Next): void => {
    toRequest(req)
      .then((request) => receiver.handleRequest(request))
      .then(async (response) => {
        res.status(response.status);
        response.headers.forEach((value, key) => res.set(key, value));
        res.send(Buffer.from(await response.arrayBuffer()));
      })
      .catch(next);
  };
}
