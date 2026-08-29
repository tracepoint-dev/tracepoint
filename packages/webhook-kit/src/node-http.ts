/**
 * `node:http` glue — works with a raw http server, Connect, and Vite dev-server
 * middleware. `import { nodeHandler } from "@tracepoint-dev/webhook-kit/node"`.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Receiver } from "./types.js";

async function toRequest(req: IncomingMessage): Promise<Request> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);

  const host = req.headers.host ?? "localhost";
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) ?? "http";
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(", "));
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  return new Request(`${proto}://${host}${req.url ?? "/"}`, {
    method: req.method,
    headers,
    body: hasBody && chunks.length ? Buffer.concat(chunks) : undefined,
  });
}

async function send(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await response.arrayBuffer()));
}

/** Middleware `(req, res, next?)`. Call `next()` yourself only after a prefix check. */
export function nodeHandler(receiver: Receiver) {
  return (req: IncomingMessage, res: ServerResponse, next?: (err?: unknown) => void): void => {
    toRequest(req)
      .then((request) => receiver.handleRequest(request))
      .then((response) => send(res, response))
      .catch((err) => {
        if (next) return next(err);
        res.statusCode = 500;
        res.end(String(err));
      });
  };
}
