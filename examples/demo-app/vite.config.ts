import { fileURLToPath } from "node:url";
import { createReceiver } from "@tracepoint-dev/webhook-kit";
import { nodeHandler } from "@tracepoint-dev/webhook-kit/node";
import { jsonFileStore } from "@tracepoint-dev/webhook-kit/stores";
import react from "@vitejs/plugin-react";
import { type Plugin, defineConfig } from "vite";

/** Mounts a real @tracepoint-dev/webhook-kit receiver at /tracepoint for the demo + e2e. */
function tracepointReceiver(): Plugin {
  // In-repo + git-ignored (see .gitignore) so the captured corpus is easy to
  // inspect and point the MCP dogfood spike at. Follows the `.tracepoint/` convention.
  const receiver = createReceiver({
    store: jsonFileStore({ dir: fileURLToPath(new URL(".tracepoint", import.meta.url)) }),
    dashboard: true,
    mcp: true,
    basePath: "/tracepoint",
  });
  const handle = nodeHandler(receiver);

  return {
    name: "tracepoint-receiver",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/tracepoint")) handle(req, res, next);
        else next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tracepointReceiver()],
  server: { port: 3100 },
  preview: { port: 4173 },
});
