/**
 * `@tracepoint-dev/webhook-kit/mcp` — a read-only MCP surface over a {@link Store}.
 *
 * Ships as its own subpath so `@modelcontextprotocol/sdk` (+ `zod`) stay optional
 * peers — `npm i @tracepoint-dev/webhook-kit` alone never pulls them. The
 * receiver reaches this module by dynamic `import()` only when `mcp: true`.
 *
 * Transport: MCP Streamable HTTP in **stateless** mode — a fresh server +
 * transport per request, JSON response, no session state. Works on serverless.
 */
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { Store } from "../types.js";
import { buildMcpServer } from "./server.js";

export { buildMcpServer } from "./server.js";
export { GUIDE } from "./guide.js";

/**
 * Build a `(Request) => Promise<Response>` MCP handler over `store`. Mount it
 * wherever you like, or let `createReceiver({ mcp: true })` serve it at `/mcp`.
 * Only ever exposes `approved` reports; there is no write path.
 */
export function mcpHandler(store: Store): (request: Request) => Promise<Response> {
  return async (request) => {
    const server = buildMcpServer(store);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    try {
      await server.connect(transport);
      return await transport.handleRequest(request);
    } finally {
      await server.close().catch(() => {});
    }
  };
}
