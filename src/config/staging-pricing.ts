import { volumeTotalCents, type VolumeTier } from "@/lib/tools/volume";

/**
 * Virtual staging prices: one source for the tool definition (what Stripe charges), the order form and the free cost
 * calculator. Client-safe (no server imports). The live base price is the Product row, seeded from STAGING_UNIT_CENTS.
 */
export const STAGING_UNIT_CENTS = 1500;
/** Rooms (photos) in one order. */
export const STAGING_MAX_ROOMS = 10;
/** 5 photos for $60, 10 photos for $99 (growth plan of 2026-09-30). */
export const STAGING_VOLUME_TIERS: VolumeTier[] = [
  { from: 5, unitCents: 1200 },
  { from: 10, unitCents: 990 },
];
/** The price in one line, for pages that quote it. */
export const STAGING_PRICE_LINE = "$15 per photo, $12 each from 5 photos, $99 for 10";

/** Staging `photos` photos of one listing, in as few orders of up to STAGING_MAX_ROOMS as possible, in cents. */
export function stagingListingCents(photos: number, unitCents = STAGING_UNIT_CENTS): number {
  const n = Math.max(0, Math.floor(photos));
  const fullOrders = Math.floor(n / STAGING_MAX_ROOMS);
  const rest = n % STAGING_MAX_ROOMS;
  const full = volumeTotalCents(STAGING_MAX_ROOMS, unitCents, STAGING_VOLUME_TIERS);
  return fullOrders * full + (rest ? volumeTotalCents(rest, unitCents, STAGING_VOLUME_TIERS, STAGING_MAX_ROOMS) : 0);
}
