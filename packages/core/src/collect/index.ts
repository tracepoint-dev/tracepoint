/**
 * Diagnostic collectors (ADR 0004). One `createCollectors(config)` call, made
 * once by the runtime and the headless runtime. Framework-agnostic — no import
 * from `ui/`, `state/`, or `runtime.ts`.
 *
 * `console` capture also enables the uncaught-error collector.
 */
import type { CollectorSnapshot, NormalizedConfig } from "../internal-types.js";
import { createTextRedactor } from "../privacy/redact-text.js";
import { info } from "../util/logger.js";
import { type ConsoleCollector, createConsoleCollector } from "./console.js";
import { type ErrorCollector, createErrorCollector } from "./errors.js";
import { type NetworkCollector, createNetworkCollector } from "./network.js";

export interface Collectors {
  /** Current contents — call at submit time. */
  snapshot(): CollectorSnapshot;
  /** Un-patch every global and clear every buffer. */
  destroy(): void;
}

function announce(config: NormalizedConfig): void {
  const on: string[] = [];
  if (config.console) on.push("console + uncaught errors");
  if (config.network) on.push("network request metadata (no bodies or headers)");
  if (on.length > 0) {
    info(`diagnostics capture enabled: ${on.join(", ")}. Sent only when a report is submitted.`);
  }
}

export function createCollectors(config: NormalizedConfig): Collectors {
  // Notice first, before console is patched, so it isn't captured into itself.
  announce(config);

  const redact = createTextRedactor(config);
  let consoleCollector: ConsoleCollector | null = null;
  let errorCollector: ErrorCollector | null = null;
  let networkCollector: NetworkCollector | null = null;

  if (config.console) {
    consoleCollector = createConsoleCollector(config.console, redact);
    errorCollector = createErrorCollector(redact);
  }
  if (config.network) {
    networkCollector = createNetworkCollector(config.network, {
      selfUrl: config.webhook,
      urlParams: config.redactUrlParams,
    });
  }

  return {
    snapshot: (): CollectorSnapshot => ({
      console: consoleCollector?.snapshot() ?? [],
      errors: errorCollector?.snapshot() ?? [],
      network: networkCollector?.snapshot() ?? [],
      enabled: { console: config.console !== null, network: config.network !== null },
    }),
    destroy(): void {
      consoleCollector?.destroy();
      errorCollector?.destroy();
      networkCollector?.destroy();
    },
  };
}
