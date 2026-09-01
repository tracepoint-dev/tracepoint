import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/stores/index.ts",
    "src/connectors/index.ts",
    "src/dashboard/index.ts",
    "src/mcp/index.ts",
    "src/express.ts",
    "src/node-http.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: false,
  treeshake: true,
  // optional peers — never bundle them
  external: ["better-sqlite3", "node:sqlite", "@modelcontextprotocol/sdk", "zod"],
});
