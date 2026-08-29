import type { DescriptorBundle } from "../types.js";
import { buildDescriptor } from "./descriptor.js";
import { createPicker } from "./picker.js";

export interface HighlightLike {
  show(rect: DOMRect): void;
  hide(): void;
}

/** One-shot pick: resolves with the picked element's descriptor, or `null` if cancelled. */
export function pickOnce(
  host: Element,
  highlight: HighlightLike,
): Promise<DescriptorBundle | null> {
  return new Promise((resolve) => {
    const picker = createPicker({
      host,
      onHover: (el) => highlight.show(el.getBoundingClientRect()),
      onPick: (el) => {
        picker.stop();
        highlight.hide();
        resolve(buildDescriptor(el));
      },
      onCancel: () => {
        picker.stop();
        highlight.hide();
        resolve(null);
      },
    });
    picker.start();
  });
}
