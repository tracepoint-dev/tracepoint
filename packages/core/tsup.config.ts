import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
  version: string;
};

// Baked into the bundle so payloads report the real released version.
// `constants.ts` falls back to "0.0.0" when this is absent (Vitest, vite dev).
const define = { __TP_SDK_VERSION__: JSON.stringify(pkg.version) };

export default defineConfig([
  // npm build — ESM + CJS + types. `modern-screenshot` stays a lazy async import.
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: false,
    treeshake: true,
    define,
  },
  // <script src> build — one minified IIFE with everything inlined (ADR 0001 D2).
  {
    entry: { tracepoint: "src/global.ts" },
    format: ["iife"],
    globalName: "__tracepointGlobal",
    outExtension: () => ({ js: ".global.js" }),
    platform: "browser",
    minify: true,
    sourcemap: false,
    treeshake: true,
    noExternal: [/.*/],
    define,
  },
]);
