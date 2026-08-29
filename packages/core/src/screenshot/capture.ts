/**
 * DOM screenshot via `modern-screenshot`, loaded lazily on first use so it stays
 * out of the entry bundle (ADR 0001 D2). Viewport-clipped by default; own UI root
 * excluded; capped scale; times out and fails soft (report still sends without it).
 */
import { ROOT_ID, SCREENSHOT_TIMEOUT_MS } from "../constants.js";
import type { Screenshot } from "../internal-types.js";
import { warn } from "../util/logger.js";

type ModernScreenshot = typeof import("modern-screenshot");

let modulePromise: Promise<ModernScreenshot> | null = null;
function loadModule(): Promise<ModernScreenshot> {
  if (!modulePromise) modulePromise = import("modern-screenshot");
  return modulePromise;
}

/** Test hook — drop the cached dynamic import. */
export function _resetScreenshotModule(): void {
  modulePromise = null;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`screenshot timed out after ${ms}ms`)), ms),
    ),
  ]);
}

const excludeOwnRoot = (node: Node): boolean =>
  !(node instanceof Element && (node.id === ROOT_ID || node.closest?.(`#${ROOT_ID}`) != null));

export interface CaptureOptions {
  /** Capture the whole document instead of just the visible viewport. */
  fullPage?: boolean;
}

export async function captureScreenshot(opts: CaptureOptions = {}): Promise<Screenshot | null> {
  try {
    const { domToCanvas } = await loadModule();
    const scale = Math.min(window.devicePixelRatio || 1, 2);

    const canvas = await withTimeout(
      domToCanvas(document.documentElement, {
        scale,
        filter: excludeOwnRoot,
        backgroundColor: "#ffffff",
        ...(opts.fullPage
          ? {}
          : {
              width: window.innerWidth,
              height: window.innerHeight,
              style: {
                transform: `translate(${-window.scrollX}px, ${-window.scrollY}px)`,
                transformOrigin: "top left",
              },
            }),
      }),
      SCREENSHOT_TIMEOUT_MS,
    );

    return {
      mimeType: "image/png",
      dataUrl: canvas.toDataURL("image/png"),
      width: canvas.width,
      height: canvas.height,
    };
  } catch (err) {
    warn(`screenshot failed: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}
