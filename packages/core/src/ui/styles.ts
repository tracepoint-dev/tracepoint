/** Styles for the shadow root. Scoped by the shadow boundary; `:host` resets inheritance. */
export const STYLES = `
:host {
  all: initial;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
}
* { box-sizing: border-box; }

.tp-fab {
  position: fixed; right: 20px; bottom: 20px; z-index: 2147483000;
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 16px; border: none; border-radius: 999px;
  background: #146b6b; color: #fff; font-size: 13px; font-weight: 600;
  cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,.25);
}
.tp-fab:hover { background: #0f5555; }

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
  position: fixed; right: 20px; bottom: 20px; z-index: 2147483100;
  width: 340px; max-height: 70vh; overflow: auto;
  padding: 14px; border-radius: 12px;
  background: #fff; color: #16211f; border: 1px solid #d8e0dd;
  box-shadow: 0 12px 40px rgba(0,0,0,.22);
  font-size: 13px;
}
.tp-panel h2 { margin: 0 0 8px; font-size: 13px; font-weight: 700; }
.tp-target {
  margin: 0 0 8px; padding: 6px 8px; border-radius: 6px;
  background: #f4f6f5; font-family: ui-monospace, monospace; font-size: 11px;
  word-break: break-all;
}
.tp-shot { width: 100%; border: 1px solid #e0e5e3; border-radius: 6px; display: block; }
.tp-shot-empty {
  padding: 16px; text-align: center; color: #5b6662;
  border: 1px dashed #d8e0dd; border-radius: 6px;
}
.tp-panel textarea {
  width: 100%; min-height: 64px; margin: 10px 0; padding: 8px;
  border: 1px solid #d8e0dd; border-radius: 6px; font: inherit; resize: vertical;
}
.tp-row { display: flex; gap: 8px; }
.tp-btn {
  flex: 1; padding: 8px 12px; border-radius: 6px; border: none;
  font-size: 12px; font-weight: 600; cursor: pointer;
}
.tp-btn-primary { background: #146b6b; color: #fff; }
.tp-btn-ghost { background: #eef1f0; color: #16211f; }
.tp-status { margin: 4px 0; color: #5b6662; }
.tp-error { margin: 0 0 10px; color: #b3261e; }
`;
