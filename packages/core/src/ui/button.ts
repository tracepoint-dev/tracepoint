import type { NormalizedUi } from "../internal-types.js";
import { el } from "./dom.js";

type ButtonCfg = NonNullable<NormalizedUi["button"]>;

function iconNode(icon: string): Node {
  const wrap = document.createElement("span");
  if (icon.trimStart().startsWith("<")) {
    wrap.innerHTML = icon; // developer-supplied SVG markup, injected as-is
    return wrap.firstElementChild ?? wrap;
  }
  const img = document.createElement("img");
  img.src = icon;
  img.alt = "";
  return img;
}

export function createButton(cfg: ButtonCfg, onOpen: () => void): HTMLElement {
  const iconOnly = cfg.variant === "icon" || cfg.label === "";
  const button = el("button", {
    class: iconOnly ? "tp-fab tp-fab-icon" : "tp-fab",
    type: "button",
    "aria-label": cfg.label || "Report an issue",
    onClick: onOpen,
  });

  if (cfg.icon) button.append(iconNode(cfg.icon));
  if (!iconOnly) button.append(cfg.label);
  return button;
}

export function createHint(text: string): HTMLElement {
  return el("div", { class: "tp-hint", text });
}
