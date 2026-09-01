/**
 * A capped, drop-oldest buffer (ADR 0004 D7). Used by the console and network
 * collectors. Optionally bounds total serialized bytes as well as entry count.
 */

export interface RingBufferOptions<T> {
  /** Max number of retained entries. */
  limit: number;
  /** Optional aggregate byte budget across retained entries. */
  maxBytes?: number;
  /** Byte size of one entry — required when `maxBytes` is set. */
  sizeOf?: (item: T) => number;
}

export interface RingBuffer<T> {
  push(item: T): void;
  toArray(): T[];
  clear(): void;
  /** How many entries have been evicted over the buffer's lifetime. */
  readonly dropped: number;
}

export function createRingBuffer<T>(opts: RingBufferOptions<T>): RingBuffer<T> {
  const items: T[] = [];
  const sizes: number[] = [];
  const limit = Math.max(1, Math.floor(opts.limit));
  const maxBytes = opts.maxBytes;
  const sizeOf = opts.sizeOf;
  let bytes = 0;
  let dropped = 0;

  function evictOldest(): void {
    items.shift();
    bytes -= sizes.shift() ?? 0;
    dropped++;
  }

  return {
    push(item: T): void {
      const size = maxBytes !== undefined && sizeOf ? sizeOf(item) : 0;
      items.push(item);
      sizes.push(size);
      bytes += size;

      while (items.length > limit) evictOldest();
      if (maxBytes !== undefined) {
        // keep at least one entry even if it alone exceeds the budget
        while (items.length > 1 && bytes > maxBytes) evictOldest();
      }
    },
    toArray: () => items.slice(),
    clear(): void {
      items.length = 0;
      sizes.length = 0;
      bytes = 0;
    },
    get dropped(): number {
      return dropped;
    },
  };
}
