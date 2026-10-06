import { packApplies, volumeTotalCents, type PackPrice, type VolumeTier } from "@/lib/tools/volume";

/**
 * Virtual staging prices: one source for the tool definition (what Stripe charges), the order form, the free cost
 * calculator and the guides. Client-safe (no server imports). The live base price is the Product row, seeded from
 * STAGING_UNIT_CENTS.
 *
 * Price structure ruled by the court of agents on 2026-10-06 (docs/COURT_2026-10-06.md, session 2):
 * - a single room is $15;
 * - the Listing Pack: up to 5 rooms of one listing plus the MLS listing description for $49, each room beyond 5 for
 *   $10, so 10 rooms are $99. It applies whenever it is cheaper than $15 a room, which is from 4 rooms;
 * - orders the pack doesn't cover (1-3 rooms) can add the MLS description for $7;
 * - the old "$12 each from 5 photos" tier is gone.
 */
export const STAGING_UNIT_CENTS = 1500;
/** Rooms (photos) in one order. */
export const STAGING_MAX_ROOMS = 10;
/** No per-photo discount tiers since 2026-10-06: the Listing Pack replaced "$12 each from 5". */
export const STAGING_VOLUME_TIERS: VolumeTier[] = [];
export const STAGING_PACK: PackPrice = { cents: 4900, units: 5, extraUnitCents: 1000 };
/** The MLS description added to an order of 1-3 rooms (the Listing Pack includes it). */
export const STAGING_DESCRIPTION_ADDON_CENTS = 700;
/** The price in one line, for pages that quote it. */
export const STAGING_PRICE_LINE = "$15 a room, or $49 for a whole listing (up to 5 rooms + the MLS description), $99 for 10";

/** One order of `photos` rooms (at most STAGING_MAX_ROOMS), in cents, without the optional description add-on. */
export function stagingOrderCents(photos: number, unitCents = STAGING_UNIT_CENTS): number {
  const n = Math.min(STAGING_MAX_ROOMS, Math.max(0, Math.floor(photos)));
  return n === 0 ? 0 : volumeTotalCents(n, unitCents, STAGING_VOLUME_TIERS, STAGING_MAX_ROOMS, STAGING_PACK);
}

/** Whether an order of `photos` rooms is a Listing Pack (and so includes the MLS description). */
export function stagingIncludesDescription(photos: number, unitCents = STAGING_UNIT_CENTS): boolean {
  const n = Math.min(STAGING_MAX_ROOMS, Math.max(0, Math.floor(photos)));
  return n > 0 && packApplies(n, unitCents, STAGING_VOLUME_TIERS, STAGING_MAX_ROOMS, STAGING_PACK);
}

/** Staging `photos` photos of one listing, in as few orders of up to STAGING_MAX_ROOMS as possible, in cents. */
export function stagingListingCents(photos: number, unitCents = STAGING_UNIT_CENTS): number {
  const n = Math.max(0, Math.floor(photos));
  const fullOrders = Math.floor(n / STAGING_MAX_ROOMS);
  const rest = n % STAGING_MAX_ROOMS;
  return fullOrders * stagingOrderCents(STAGING_MAX_ROOMS, unitCents) + stagingOrderCents(rest, unitCents);
}
