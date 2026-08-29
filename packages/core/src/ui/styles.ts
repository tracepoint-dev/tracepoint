/** Styles for the shadow root. Tokens (`--tp-*`) are overridable via the `theme` config. */
export const STYLES = `
:host {
  all: initial;
  --tp-accent: #146b6b;
  --tp-accent-hover: #0f5555;
  --tp-radius: 12px;
  --tp-font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --tp-bg: #ffffff;
  --tp-fg: #16211f;
  --tp-muted: #5b6662;
  --tp-border: #d8e0dd;
  --tp-surface: #f4f6f5;
  --tp-top: auto; --tp-bottom: 20px; --tp-left: auto; --tp-right: 20px;
  font-family: var(--tp-font);
}
@media (prefers-color-scheme: dark) {
  :host(:not([data-tp-scheme="light"])) {
    --tp-bg: #1b2422; --tp-fg: #eef1f0; --tp-muted: #9aa8a3;
    --tp-border: #33403c; --tp-surface: #232e2b;
  }
}
:host([data-tp-scheme="dark"]) {
  --tp-bg: #1b2422; --tp-fg: #eef1f0; --tp-muted: #9aa8a3;
  --tp-border: #33403c; --tp-surface: #232e2b;
}
* { box-sizing: border-box; }

.tp-fab {
  position: fixed; z-index: 2147483000;
  top: var(--tp-top); bottom: var(--tp-bottom); left: var(--tp-left); right: var(--tp-right);
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 16px; border: none; border-radius: 999px;
  background: var(--tp-accent); color: #fff; font-size: 13px; font-weight: 600;
  cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,.25);
}
.tp-fab:hover { background: var(--tp-accent-hover); }
.tp-fab.tp-fab-icon { padding: 12px; border-radius: 999px; }
.tp-fab svg, .tp-fab img { width: 16px; height: 16px; display: block; }

.tp-highlight {
  position: fixed; z-index: 2147482000; pointer-events: none;
  border: 2px solid #e1522a; background: rgba(225,82,42,.08);
}

.tp-hint {
  position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
  z-index: 2147483000; padding: 6px 12px; border-radius: 8px;
  background: #16211f; color: #fff; font-size: 12px;
  box-shadow: 0 4px 14px rgba(0,0,0,.25);
}

.tp-panel {
  position: fixed; z-index: 2147483100;
  top: var(--tp-top); bottom: var(--tp-bottom); left: var(--tp-left); right: var(--tp-right);
  width: 340px; max-height: 70vh; overflow: auto;
  padding: 14px; border-radius: var(--tp-radius);
  background: var(--tp-bg); color: var(--tp-fg); border: 1px solid var(--tp-border);
  box-shadow: 0 12px 40px rgba(0,0,0,.22); font-size: 13px;
}
.tp-panel-head { display: flex; align-items: center; justify-content: space-between; }
.tp-panel h2 { margin: 0 0 8px; font-size: 13px; font-weight: 700; }
.tp-close {
  border: none; background: transparent; color: var(--tp-muted);
  font-size: 16px; line-height: 1; cursor: pointer; padding: 2px 4px;
}
.tp-close svg { width: 14px; height: 14px; display: block; }
.tp-target {
  margin: 0 0 8px; padding: 6px 8px; border-radius: 6px;
  background: var(--tp-surface); font-family: ui-monospace, monospace; font-size: 11px;
  word-break: break-all;
}
.tp-shot { width: 100%; border: 1px solid var(--tp-border); border-radius: 6px; display: block; }
.tp-shot-empty {
  padding: 16px; text-align: center; color: var(--tp-muted);
  border: 1px dashed var(--tp-border); border-radius: 6px;
}
.tp-panel textarea {
  width: 100%; min-height: 64px; margin: 10px 0; padding: 8px;
  border: 1px solid var(--tp-border); border-radius: 6px; font: inherit; resize: vertical;
  background: var(--tp-bg); color: var(--tp-fg);
}
.tp-row { display: flex; gap: 8px; }
.tp-btn {
  flex: 1; padding: 8px 12px; border-radius: 6px; border: none;
  font-size: 12px; font-weight: 600; cursor: pointer;
}
.tp-btn-primary { background: var(--tp-accent); color: #fff; }
.tp-btn-ghost { background: var(--tp-surface); color: var(--tp-fg); }
.tp-status { margin: 4px 0; color: var(--tp-muted); }
.tp-error { margin: 0 0 10px; color: #b3261e; }
`;
