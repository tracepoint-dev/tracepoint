import { defineConfig } from "tsup";

export default defineConfig([
  // npm build — ESM + CJS + types. `modern-screenshot` stays a lazy async import.
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true,
  },
  // <script src> build — one minified IIFE with everything inlined (ADR 0001 D2).
  {
    entry: { tracepoint: "src/global.ts" },
    format: ["iife"],
    globalName: "__tracepointGlobal",
    outExtension: () => ({ js: ".global.js" }),
    platform: "browser",
    minify: true,
    sourcemap: true,
    treeshake: true,
    noExternal: [/.*/],
  },
]);
