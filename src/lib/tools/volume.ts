/**
 * Volume pricing for tools priced per unit (virtual staging: per photo). Pure and client-safe: the order form shows the
 * same total the server charges (src/lib/orders/create.ts), computed by the same function.
 */
export type VolumeTier = {
  /** The tier applies from this many units in one order. */
  from: number;
  /** Price per unit at this tier, in cents. */
  unitCents: number;
};

/** Unit price for an order of `n` units: the lowest tier price that applies, else the base price. */
export function volumeUnitCents(n: number, baseUnitCents: number, tiers: VolumeTier[] = []): number {
  return tiers.filter((t) => n >= t.from).reduce((u, t) => Math.min(u, t.unitCents), baseUnitCents);
}

/**
 * Total for `n` units. Never more than a larger order up to `max` would cost, so 9 photos never cost more than 10:
 * the customer always pays the cheapest way to get at least `n`.
 */
export function volumeTotalCents(n: number, baseUnitCents: number, tiers: VolumeTier[] = [], max = n): number {
  let best = n * volumeUnitCents(n, baseUnitCents, tiers);
  for (let m = n + 1; m <= max; m++) best = Math.min(best, m * volumeUnitCents(m, baseUnitCents, tiers));
  return best;
}

/** The next tier the customer could reach, for a hint like "add 2 more photos: $12 each". */
export function nextVolumeTier(n: number, tiers: VolumeTier[] = [], max = Infinity): VolumeTier | null {
  return [...tiers].sort((a, b) => a.from - b.from).find((t) => t.from > n && t.from <= max) ?? null;
}
