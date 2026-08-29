import type { ClientEnv } from "../internal-types.js";

/** Snapshot the rendering environment. Browser-only — call from an effect, not at import. */
export function readClientEnv(): ClientEnv {
  return {
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio || 1,
    },
    screen: { width: window.screen.width, height: window.screen.height },
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
