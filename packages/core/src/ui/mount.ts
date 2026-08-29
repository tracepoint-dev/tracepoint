import { ROOT_ID } from "../constants.js";
import type { NormalizedUi } from "../internal-types.js";
import { STYLES } from "./styles.js";
import { applyChrome } from "./theme.js";

export interface Shell {
  host: HTMLElement;
  shadow: ShadowRoot;
  destroy(): void;
}

/** Create the shadow-root host as a sibling of `<body>` (so body screenshots exclude it). */
export function mountShell(ui: NormalizedUi): Shell {
  const host = document.createElement("div");
  host.id = ROOT_ID;
  applyChrome(host, ui);

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = STYLES;
  shadow.append(style);

  document.documentElement.append(host);

  return {
    host,
    shadow,
    destroy: () => host.remove(),
  };
}
