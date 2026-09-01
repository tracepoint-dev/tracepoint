/**
 * Safe stringify for captured console arguments (ADR 0004 D2).
 *
 * Bounded on every axis a hostile or accidental value could blow up:
 * recursion depth, array/object breadth, and total output length. Cycles are
 * marked, not followed. DOM nodes, errors, and functions get compact tags rather
 * than a dump.
 */

const MAX_DEPTH = 4;
const MAX_ITEMS = 50;
const MAX_STRING = 2_048;

function tag(value: unknown): string | null {
  if (typeof value === "function")
    return `[Function ${(value as { name?: string }).name || "anonymous"}]`;
  if (typeof value === "symbol") return value.toString();
  if (typeof value === "bigint") return `${value}n`;
  if (value instanceof Error) {
    return `[${value.name}: ${value.message}]`;
  }
  if (typeof Node !== "undefined" && value instanceof Node) {
    const el = value as Partial<Element>;
    const name = el.nodeName?.toLowerCase() ?? "node";
    const id = (el as Element).id ? `#${(el as Element).id}` : "";
    return `[<${name}${id}>]`;
  }
  return null;
}

function clip(s: string): string {
  return s.length > MAX_STRING ? `${s.slice(0, MAX_STRING)}…(+${s.length - MAX_STRING})` : s;
}

function walk(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (value === null || value === undefined) return value;

  const t = typeof value;
  if (t === "string") return clip(value as string);
  if (t === "number" || t === "boolean") return value;

  const tagged = tag(value);
  if (tagged !== null) return tagged;

  if (t !== "object") return String(value);

  const obj = value as object;
  if (seen.has(obj)) return "[Circular]";
  if (depth >= MAX_DEPTH) return Array.isArray(obj) ? "[Array]" : "[Object]";
  seen.add(obj);

  try {
    if (Array.isArray(obj)) {
      const out = obj.slice(0, MAX_ITEMS).map((v) => walk(v, depth + 1, seen));
      if (obj.length > MAX_ITEMS) out.push(`…(+${obj.length - MAX_ITEMS})`);
      return out;
    }
    const entries = Object.entries(obj as Record<string, unknown>).slice(0, MAX_ITEMS);
    const out: Record<string, unknown> = {};
    for (const [k, v] of entries) out[k] = walk(v, depth + 1, seen);
    return out;
  } finally {
    seen.delete(obj);
  }
}

/** One console argument → a display string. */
export function serializeArg(value: unknown): string {
  if (typeof value === "string") return clip(value);
  const tagged = tag(value);
  if (tagged !== null) return tagged;
  try {
    const walked = walk(value, 0, new WeakSet());
    return typeof walked === "string" ? walked : JSON.stringify(walked);
  } catch {
    return String(value);
  }
}

/** A full console call's args → one message string, clipped to `maxBytes`. */
export function serializeArgs(args: unknown[], maxBytes: number): string {
  const joined = args.map(serializeArg).join(" ");
  if (joined.length <= maxBytes) return joined;
  return `${joined.slice(0, maxBytes)}…(clipped)`;
}
