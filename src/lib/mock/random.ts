/**
 * A tiny seeded PRNG. Every value in the mock dataset derives from it, so the
 * data is identical on the server and in the browser — no hydration drift.
 */
export function createRandom(seed: number) {
  let state = seed >>> 0;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    /** Integer in [min, max]. */
    int(min: number, max: number) {
      return min + Math.floor(next() * (max - min + 1));
    },
    pick<T>(items: readonly T[]): T {
      return items[Math.floor(next() * items.length)];
    },
    /** Picks a key from a weight map. */
    weighted<T extends string>(weights: Record<T, number>): T {
      const entries = Object.entries(weights) as [T, number][];
      const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
      let roll = next() * total;
      for (const [key, weight] of entries) {
        roll -= weight;
        if (roll <= 0) return key;
      }
      return entries[entries.length - 1][0];
    },
    chance(probability: number) {
      return next() < probability;
    },
    /** Up to `count` distinct members, order preserved. */
    sample<T>(items: readonly T[], count: number): T[] {
      const pool = [...items];
      const taken: T[] = [];
      for (let i = 0; i < count && pool.length > 0; i += 1) {
        taken.push(pool.splice(Math.floor(next() * pool.length), 1)[0]);
      }
      return taken;
    },
  };
}

export type Random = ReturnType<typeof createRandom>;
