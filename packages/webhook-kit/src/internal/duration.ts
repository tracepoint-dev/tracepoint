const UNITS = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
} as const;

type Unit = keyof typeof UNITS;

/** Parse `"90d"` / `"12h"` / `"30m"` to milliseconds. Throws on a bad value. */
export function parseDuration(value: string): number {
  const match = /^(\d+)\s*([smhdw])$/.exec(value.trim());
  if (!match) {
    throw new Error(`invalid duration: ${JSON.stringify(value)} (use e.g. "90d")`);
  }
  return Number(match[1]) * UNITS[match[2] as Unit];
}
