/**
 * Descriptor contributors (ADR 0005). `core` stays framework-agnostic; a
 * framework adapter registers a function that, given the picked DOM node,
 * returns component / source info to merge into `descriptor.component`.
 *
 * Contributors are registered by adapters, never by application code. Throws are
 * swallowed. Last non-null value wins on a field clash.
 */
import type { DescriptorComponentInfo } from "../types.js";

export type DescriptorContributor = (el: Element) => Partial<DescriptorComponentInfo> | null;

const contributors = new Set<DescriptorContributor>();

/** Register a contributor. Returns an unregister function. */
export function registerDescriptorContributor(fn: DescriptorContributor): () => void {
  contributors.add(fn);
  return () => {
    contributors.delete(fn);
  };
}

/** Run every contributor over `el` and merge. `null` if none produced anything. */
export function runContributors(el: Element): DescriptorComponentInfo | null {
  if (contributors.size === 0) return null;

  let merged: DescriptorComponentInfo | null = null;
  for (const fn of contributors) {
    let part: Partial<DescriptorComponentInfo> | null = null;
    try {
      part = fn(el);
    } catch {
      part = null;
    }
    if (!part) continue;
    merged ??= { name: null, stack: [], source: null };
    if (part.name != null) merged.name = part.name;
    if (part.stack && part.stack.length > 0) merged.stack = part.stack;
    if (part.source != null) merged.source = part.source;
  }
  return merged;
}

/** Test hook — drop all registered contributors. */
export function _resetContributors(): void {
  contributors.clear();
}
