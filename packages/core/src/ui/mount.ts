import { ROOT_ID } from "../constants.js";
import { STYLES } from "./styles.js";

export interface Shell {
  host: HTMLElement;
  shadow: ShadowRoot;
  destroy(): void;
}

/** Create the shadow-root host as a sibling of `<body>` (so body screenshots exclude it). */
export function mountShell(): Shell {
  const host = document.createElement("div");
  host.id = ROOT_ID;

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
