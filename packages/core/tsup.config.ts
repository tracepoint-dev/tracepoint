import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // M1: add a second `defineConfig` entry that emits an IIFE bundle
  // (globalName: "tracepoint") for the <script src> setup path.
});
