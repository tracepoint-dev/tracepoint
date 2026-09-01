/**
 * The MCP tool + resource surface over a {@link Store} (Phase 4b, PROJECT_CONTEXT
 * §12b). Read-only, and hard-filtered to `approved` reports — there is no
 * parameter to see pending/rejected ones, and no tool to change a status.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Store } from "../types.js";
import { GUIDE } from "./guide.js";

const MCP_SERVER_VERSION = "0.2.0";
const APPROVED = "approved" as const;

const notApproved = (id: string) => ({
  isError: true as const,
  content: [{ type: "text" as const, text: `no approved report with id "${id}"` }],
});

export function buildMcpServer(store: Store): McpServer {
  const server = new McpServer({ name: "tracepoint", version: MCP_SERVER_VERSION });

  server.registerTool(
    "list_reports",
    {
      title: "List approved reports",
      description:
        "Approved user-reported issues, newest first — id plus a summary (status, description, route, hasScreenshot). Call get_report for the full payload. Only reports a human has approved are visible.",
      inputSchema: { limit: z.number().int().positive().max(200).optional() },
    },
    async ({ limit }) => {
      const rows = await store.list({ status: APPROVED, limit: limit ?? 50 });
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    },
  );

  server.registerTool(
    "get_report",
    {
      title: "Get one approved report",
      description:
        "The full report envelope (schema 2.0) for an approved report id: report.description, target (descriptor + component + source), page, client, context, console, errors, network, capture. Read the `tracepoint://guide` resource first. Refuses ids that are not approved.",
      inputSchema: { id: z.string().min(1) },
    },
    async ({ id }) => {
      const report = await store.get(id);
      if (!report || report.status !== APPROVED) return notApproved(id);
      return { content: [{ type: "text", text: JSON.stringify(report.payload, null, 2) }] };
    },
  );

  server.registerTool(
    "get_screenshot",
    {
      title: "Get an approved report's screenshot",
      description:
        "The PNG the user captured with the report, as an image. May be absent (screenshot capture can fail soft).",
      inputSchema: { id: z.string().min(1) },
    },
    async ({ id }) => {
      const report = await store.get(id);
      if (!report || report.status !== APPROVED) return notApproved(id);
      const shot = await store.readScreenshot(id);
      if (!shot) return { content: [{ type: "text", text: `no screenshot for "${id}"` }] };
      return {
        content: [
          {
            type: "image",
            data: Buffer.from(shot.bytes).toString("base64"),
            mimeType: shot.mimeType,
          },
        ],
      };
    },
  );

  server.registerResource(
    "guide",
    "tracepoint://guide",
    { title: "How to act on a Tracepoint report", mimeType: "text/markdown" },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "text/markdown", text: GUIDE }],
    }),
  );

  return server;
}
