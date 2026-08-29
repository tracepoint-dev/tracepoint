import { tmpdir } from "node:os";
import { join } from "node:path";
import { createReceiver } from "@tracepoint-dev/webhook-kit";
import { nodeHandler } from "@tracepoint-dev/webhook-kit/node";
import { jsonFileStore } from "@tracepoint-dev/webhook-kit/stores";
import react from "@vitejs/plugin-react";
import { type Plugin, defineConfig } from "vite";

/** Mounts a real @tracepoint-dev/webhook-kit receiver at /__tp for the demo + e2e. */
function tracepointReceiver(): Plugin {
  const receiver = createReceiver({
    store: jsonFileStore({ dir: join(tmpdir(), "tracepoint-demo") }),
    dashboard: true,
    basePath: "/__tp",
  });
  const handle = nodeHandler(receiver);

  return {
    name: "tracepoint-receiver",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/__tp")) handle(req, res, next);
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
