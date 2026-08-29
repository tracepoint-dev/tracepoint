/**
 * Pick mode: follow the pointer, and on click select the element under it.
 * Capture-phase listeners so the host app's own handlers don't fire on the pick.
 */

export interface Picker {
  start(): void;
  stop(): void;
}

export interface PickerOptions {
  /** The shadow host — clicks/hovers whose path includes it are our own UI. */
  host: Element;
  onHover(el: Element): void;
  onPick(el: Element): void;
  onCancel(): void;
}

function innermost(event: Event): Element | null {
  const path = event.composedPath();
  const first = path[0];
  return first instanceof Element ? first : null;
}

export function createPicker({ host, onHover, onPick, onCancel }: PickerOptions): Picker {
  let active = false;

  const onMove = (event: MouseEvent) => {
    if (!active || event.composedPath().includes(host)) return;
    const el = innermost(event);
    if (el) onHover(el);
  };

  const onClick = (event: MouseEvent) => {
    if (!active) return;
    if (event.composedPath().includes(host)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const el = innermost(event);
    if (el) onPick(el);
  };

  const onKey = (event: KeyboardEvent) => {
    if (active && event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };

  return {
    start() {
      if (active) return;
      active = true;
      // defer so the click that opened pick mode isn't caught as a pick
      setTimeout(() => {
        document.addEventListener("mousemove", onMove, true);
        document.addEventListener("click", onClick, true);
        document.addEventListener("keydown", onKey, true);
      }, 0);
    },
    stop() {
      active = false;
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey, true);
    },
  };
}
