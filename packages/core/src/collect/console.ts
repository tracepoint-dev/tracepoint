/**
 * Console collector (ADR 0004 D2/D3/D4).
 *
 * Patches the configured `console` levels at construction, buffers a redacted,
 * serialized copy of each call, collapses consecutive identical lines, and
 * restores the originals on `destroy()` — but only if our wrapper is still the
 * one installed (another tool may have wrapped us afterwards).
 */
import type { ConsoleEntry, NormalizedConsoleCapture } from "../internal-types.js";
import type { ConsoleLevel } from "../types.js";
import { createRingBuffer } from "./ring-buffer.js";
import { serializeArgs } from "./serialize.js";

type Redactor = (value: string) => string;
type ConsoleFn = (...args: unknown[]) => void;

export interface ConsoleCollector {
  snapshot(): ConsoleEntry[];
  destroy(): void;
}

export function createConsoleCollector(
  cfg: NormalizedConsoleCapture,
  redact: Redactor,
): ConsoleCollector {
  const buffer = createRingBuffer<ConsoleEntry>({
    limit: cfg.limit,
    maxBytes: cfg.totalBytes,
    sizeOf: (e) => e.message.length,
  });
  const sink = console as unknown as Record<string, ConsoleFn>;
  const originals = new Map<ConsoleLevel, ConsoleFn>();
  const wrappers = new Map<ConsoleLevel, ConsoleFn>();
  let last: ConsoleEntry | null = null;

  for (const level of cfg.levels) {
    const prev = sink[level];
    if (typeof prev !== "function") continue;
    originals.set(level, prev);

    const wrapper: ConsoleFn = (...args: unknown[]): void => {
      try {
        const message = redact(serializeArgs(args, cfg.maxEntryBytes));
        if (last && last.level === level && last.message === message) {
          last.count = (last.count ?? 1) + 1;
        } else {
          last = { level, message, ts: Math.round(performance.now()) };
          buffer.push(last);
        }
      } catch {
        // capture must never break the app's own console call
      }
      prev(...args);
    };
    wrappers.set(level, wrapper);
    sink[level] = wrapper;
  }

  return {
    snapshot: () => buffer.toArray(),
    destroy() {
      for (const [level, wrapper] of wrappers) {
        const original = originals.get(level);
        if (sink[level] === wrapper && original) sink[level] = original;
      }
      wrappers.clear();
      buffer.clear();
      last = null;
    },
  };
}
