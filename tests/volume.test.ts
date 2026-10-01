import { describe, expect, it } from "vitest";
import { nextVolumeTier, volumeTotalCents, volumeUnitCents } from "@/lib/tools/volume";
import { STAGING_MAX_ROOMS, STAGING_UNIT_CENTS, STAGING_VOLUME_TIERS, stagingListingCents } from "@/config/staging-pricing";
import { getToolBySlug } from "@/lib/tools/registry";

const tiers = STAGING_VOLUME_TIERS;

describe("volume pricing", () => {
  it("5 photos $60, 10 photos $99, $15 below 5", () => {
    expect([1, 2, 3, 4].map((n) => volumeTotalCents(n, 1500, tiers, 10))).toEqual([1500, 3000, 4500, 6000]);
    expect(volumeTotalCents(5, 1500, tiers, 10)).toBe(6000);
    expect(volumeTotalCents(8, 1500, tiers, 10)).toBe(9600);
    expect(volumeTotalCents(10, 1500, tiers, 10)).toBe(9900);
    expect(volumeUnitCents(4, 1500, tiers)).toBe(1500);
    expect(volumeUnitCents(7, 1500, tiers)).toBe(1200);
    expect(volumeUnitCents(10, 1500, tiers)).toBe(990);
  });

  it("never charges more for fewer photos: 9 cost what 10 cost", () => {
    expect(volumeTotalCents(9, 1500, tiers, 10)).toBe(9900);
    for (let n = 1; n < 10; n++) expect(volumeTotalCents(n, 1500, tiers, 10)).toBeLessThanOrEqual(volumeTotalCents(n + 1, 1500, tiers, 10));
    // every total divides into whole cents per photo, so Stripe can show "n × price"
    for (let n = 1; n <= 10; n++) expect(volumeTotalCents(n, 1500, tiers, 10) % n).toBe(0);
  });

  it("points at the next tier", () => {
    expect(nextVolumeTier(3, tiers, 10)).toEqual({ from: 5, unitCents: 1200 });
    expect(nextVolumeTier(5, tiers, 10)).toEqual({ from: 10, unitCents: 990 });
    expect(nextVolumeTier(10, tiers, 10)).toBeNull();
  });

  it("the staging tool, the order form and the calculator share one price table", () => {
    const def = getToolBySlug("virtual-staging")!;
    expect(def.pricing.priceCents).toBe(STAGING_UNIT_CENTS);
    expect(def.pricing.volume).toBe(STAGING_VOLUME_TIERS);
    expect(def.intake.fields.find((f) => f.type === "rooms")?.max).toBe(STAGING_MAX_ROOMS);
    expect(stagingListingCents(10)).toBe(9900);
    expect(stagingListingCents(23)).toBe(9900 * 2 + 4500);
  });
});
