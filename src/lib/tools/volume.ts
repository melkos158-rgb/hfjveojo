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

/**
 * A package price (virtual staging: the Listing Pack): up to `units` for `cents`, each unit beyond that for
 * `extraUnitCents`. It applies whenever it is cheaper than the per-unit price, and it may include an extra
 * (ToolPricing.packIncludes), so the order records whether the pack was used (packApplies).
 */
export type PackPrice = { cents: number; units: number; extraUnitCents: number };

/** The pack price of exactly `n` units. */
export function packCents(n: number, pack: PackPrice): number {
  return pack.cents + Math.max(0, n - pack.units) * pack.extraUnitCents;
}

/** Unit price for an order of `n` units: the lowest tier price that applies, else the base price. */
export function volumeUnitCents(n: number, baseUnitCents: number, tiers: VolumeTier[] = []): number {
  return tiers.filter((t) => n >= t.from).reduce((u, t) => Math.min(u, t.unitCents), baseUnitCents);
}

/** The price of exactly `n` units: per unit (with tiers) or the pack, whichever is lower. */
function exactCents(n: number, baseUnitCents: number, tiers: VolumeTier[], pack: PackPrice | null | undefined): number {
  const perUnit = n * volumeUnitCents(n, baseUnitCents, tiers);
  return pack ? Math.min(perUnit, packCents(n, pack)) : perUnit;
}

/**
 * Total for `n` units. Never more than a larger order up to `max` would cost, so 9 photos never cost more than 10:
 * the customer always pays the cheapest way to get at least `n`.
 */
export function volumeTotalCents(n: number, baseUnitCents: number, tiers: VolumeTier[] = [], max = n, pack?: PackPrice | null): number {
  let best = exactCents(n, baseUnitCents, tiers, pack);
  for (let m = n + 1; m <= max; m++) best = Math.min(best, exactCents(m, baseUnitCents, tiers, pack));
  return best;
}

/** Whether `n` units are cheapest as the pack, so the order gets what the pack includes (e.g. the MLS description). */
export function packApplies(n: number, baseUnitCents: number, tiers: VolumeTier[] = [], max = n, pack?: PackPrice | null): boolean {
  if (!pack) return false;
  return volumeTotalCents(n, baseUnitCents, tiers, max, pack) < volumeTotalCents(n, baseUnitCents, tiers, max, null);
}

/** The next tier the customer could reach, for a hint like "add 2 more photos: $12 each" (staging has no tiers since 6 Oct 2026). */
export function nextVolumeTier(n: number, tiers: VolumeTier[] = [], max = Infinity): VolumeTier | null {
  return [...tiers].sort((a, b) => a.from - b.from).find((t) => t.from > n && t.from <= max) ?? null;
}
