/** Normalise the `ui` config into a fully-resolved {@link NormalizedUi} (ADR 0002). */
import type { NormalizedUi, Position } from "./internal-types.js";
import { warnOnce } from "./util/logger.js";

const POSITIONS: Position[] = ["bottom-right", "bottom-left", "top-right", "top-left"];
const VARIANTS = ["pill", "icon"] as const;
const SCHEMES = ["light", "dark", "auto"] as const;
const LABEL_KEYS = [
  "title",
  "placeholder",
  "submit",
  "cancel",
  "retry",
  "close",
  "success",
] as const;

export function defaultUi(): NormalizedUi {
  return {
    position: "bottom-right",
    theme: { accent: null, radius: null, font: null, colorScheme: "auto" },
    button: { icon: null, label: "Report an issue", variant: "pill" },
    trigger: null,
    icons: { close: null },
    labels: {
      title: "Report an issue",
      placeholder: "Describe the issue…",
      submit: "Send",
      cancel: "Cancel",
      retry: "Retry",
      close: "Close",
      success: "Sent — thanks",
    },
  };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function applyTheme(ui: NormalizedUi, raw: Record<string, unknown>): void {
  ui.theme.accent = str(raw.accent) ?? ui.theme.accent;
  ui.theme.radius = str(raw.radius) ?? ui.theme.radius;
  ui.theme.font = str(raw.font) ?? ui.theme.font;
  if (SCHEMES.includes(raw.colorScheme as never)) {
    ui.theme.colorScheme = raw.colorScheme as NormalizedUi["theme"]["colorScheme"];
  }
}

function applyButton(ui: NormalizedUi, raw: unknown): void {
  if (raw === false) {
    ui.button = null;
    return;
  }
  if (!isObject(raw)) return;
  const button = ui.button ?? { icon: null, label: "Report an issue", variant: "pill" };
  if (raw.icon === false) button.icon = null;
  else button.icon = str(raw.icon) ?? button.icon;
  button.label = str(raw.label) ?? button.label;
  if (VARIANTS.includes(raw.variant as never)) {
    button.variant = raw.variant as "pill" | "icon";
  }
  ui.button = button;
}

function applyLabels(ui: NormalizedUi, raw: Record<string, unknown>): void {
  for (const key of LABEL_KEYS) {
    const value = str(raw[key]);
    if (value !== null) ui.labels[key] = value;
  }
}

export function normalizeUi(raw: unknown): { headless: boolean; ui: NormalizedUi } {
  const ui = defaultUi();
  if (raw === false) return { headless: true, ui };
  if (raw === undefined) return { headless: false, ui };
  if (!isObject(raw)) {
    warnOnce("config:ui", "`ui` must be an object or false; using defaults.");
    return { headless: false, ui };
  }

  if (POSITIONS.includes(raw.position as never)) ui.position = raw.position as Position;
  else if (raw.position !== undefined)
    warnOnce("config:ui.position", "invalid `ui.position`; ignored.");

  if (isObject(raw.theme)) applyTheme(ui, raw.theme);
  applyButton(ui, raw.button);
  ui.trigger = str(raw.trigger) ?? null;
  if (isObject(raw.icons)) ui.icons.close = str(raw.icons.close) ?? null;
  if (isObject(raw.labels)) applyLabels(ui, raw.labels);

  return { headless: false, ui };
}
