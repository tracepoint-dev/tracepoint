/**
 * Read component / source info off the React fiber for a DOM node (ADR 0005,
 * approach c). Registered as a `core` descriptor contributor by `<Tracepoint>`.
 *
 * Everything here is best-effort and defensive:
 *  - the fiber key (`__reactFiber$<hash>`) is an internal, unofficial handle
 *  - `.name` is often mangled in production builds; `displayName` survives
 *  - `_debugSource` is dev-only and gone in React 19
 * On anything unexpected it returns `null` rather than throwing.
 */
import type { DescriptorComponentInfo } from "@tracepoint-dev/core";

interface FiberNode {
  type?: unknown;
  elementType?: unknown;
  return?: FiberNode | null;
  _debugSource?: { fileName?: string; lineNumber?: number } | null;
}

const MAX_HOPS = 60;
const MAX_STACK = 12;

/** Drop empty / obviously minifier-mangled identifiers. */
function cleanName(raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw === "_c") return null;
  if (/^[a-z]{1,2}[0-9]?$/.test(raw)) return null;
  return raw;
}

function nameOfType(type: unknown): string | null {
  if (typeof type === "function") {
    const fn = type as { displayName?: string; name?: string };
    return cleanName(fn.displayName || fn.name);
  }
  if (type && typeof type === "object") {
    const o = type as { displayName?: string; render?: unknown; type?: unknown };
    if (typeof o.displayName === "string") return cleanName(o.displayName);
    if (o.render) return nameOfType(o.render); // React.forwardRef
    if (o.type) return nameOfType(o.type); // React.memo
  }
  return null;
}

function findFiber(el: Element): FiberNode | null {
  for (const key of Object.keys(el)) {
    if (key.startsWith("__reactFiber$") || key.startsWith("__reactInternalInstance$")) {
      return (el as unknown as Record<string, FiberNode | null>)[key] ?? null;
    }
  }
  return null;
}

export function readFiberComponent(el: Element): DescriptorComponentInfo | null {
  try {
    let fiber = findFiber(el);
    if (!fiber) return null;

    const stack: string[] = [];
    let source: { file: string; line: number } | null = null;

    for (let hops = 0; fiber && hops < MAX_HOPS && stack.length < MAX_STACK; hops++) {
      const name = nameOfType(fiber.type ?? fiber.elementType);
      if (name) {
        stack.push(name);
        const ds = fiber._debugSource;
        if (!source && ds?.fileName && typeof ds.lineNumber === "number") {
          source = { file: ds.fileName, line: ds.lineNumber };
        }
      }
      fiber = fiber.return ?? null;
    }

    if (stack.length === 0 && !source) return null;
    return { name: stack[0] ?? null, stack, source };
  } catch {
    return null;
  }
}
