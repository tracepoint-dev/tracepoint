import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/stores/index.ts",
    "src/connectors/index.ts",
    "src/dashboard/index.ts",
    "src/express.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // better-sqlite3 is an optional peer — never bundle it
  external: ["better-sqlite3", "node:sqlite"],
});
