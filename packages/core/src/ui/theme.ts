import type { NormalizedUi } from "../internal-types.js";

const EDGE = "20px";

/** Set theme tokens + corner anchoring on the shadow host. */
export function applyChrome(host: HTMLElement, ui: NormalizedUi): void {
  const set = (name: string, value: string | null) => {
    if (value) host.style.setProperty(name, value);
  };

  set("--tp-accent", ui.theme.accent);
  set("--tp-radius", ui.theme.radius);
  set("--tp-font", ui.theme.font);

  if (ui.theme.colorScheme !== "auto") {
    host.dataset.tpScheme = ui.theme.colorScheme;
  }

  const [v, h] = ui.position.split("-");
  host.style.setProperty("--tp-top", v === "top" ? EDGE : "auto");
  host.style.setProperty("--tp-bottom", v === "bottom" ? EDGE : "auto");
  host.style.setProperty("--tp-left", h === "left" ? EDGE : "auto");
  host.style.setProperty("--tp-right", h === "right" ? EDGE : "auto");
}
