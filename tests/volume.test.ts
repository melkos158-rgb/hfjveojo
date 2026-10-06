import { describe, expect, it } from "vitest";
import { nextVolumeTier, packApplies, packCents, volumeTotalCents, volumeUnitCents } from "@/lib/tools/volume";
import {
  STAGING_DESCRIPTION_ADDON_CENTS,
  STAGING_MAX_ROOMS,
  STAGING_PACK,
  STAGING_PRICE_LINE,
  STAGING_UNIT_CENTS,
  STAGING_VOLUME_TIERS,
  stagingIncludesDescription,
  stagingListingCents,
  stagingOrderCents,
} from "@/config/staging-pricing";
import { getToolBySlug } from "@/lib/tools/registry";

const order = (n: number) => volumeTotalCents(n, STAGING_UNIT_CENTS, STAGING_VOLUME_TIERS, STAGING_MAX_ROOMS, STAGING_PACK);

describe("staging prices (court ruling of 6 Oct 2026)", () => {
  it("$15 a room for 1-3 rooms, the $49 Listing Pack for 4-5, then $10 a room up to $99 for 10", () => {
    expect([1, 2, 3].map(order)).toEqual([1500, 3000, 4500]);
    expect([4, 5].map(order)).toEqual([4900, 4900]);
    expect([6, 7, 8, 9, 10].map(order)).toEqual([5900, 6900, 7900, 8900, 9900]);
    expect(packCents(10, STAGING_PACK)).toBe(9900);
  });

  it("never charges more for fewer rooms, and the pack (with the MLS description) starts at 4 rooms", () => {
    for (let n = 1; n < STAGING_MAX_ROOMS; n++) expect(order(n)).toBeLessThanOrEqual(order(n + 1));
    expect([1, 2, 3, 4, 5, 10].map((n) => stagingIncludesDescription(n))).toEqual([false, false, false, true, true, true]);
    expect(stagingIncludesDescription(0)).toBe(false);
  });

  it("keeps per-unit tiers working for tools that use them", () => {
    const tiers = [
      { from: 5, unitCents: 1200 },
      { from: 10, unitCents: 990 },
    ];
    expect(volumeTotalCents(5, 1500, tiers, 10)).toBe(6000);
    expect(volumeTotalCents(9, 1500, tiers, 10)).toBe(9900);
    expect(volumeUnitCents(7, 1500, tiers)).toBe(1200);
    expect(nextVolumeTier(3, tiers, 10)).toEqual({ from: 5, unitCents: 1200 });
    expect(packApplies(5, 1500, tiers, 10)).toBe(false);
    expect(nextVolumeTier(3, STAGING_VOLUME_TIERS, 10)).toBeNull();
  });

  it("the staging tool, the order form and the calculator share one price table", () => {
    const def = getToolBySlug("virtual-staging")!;
    expect(def.pricing.priceCents).toBe(STAGING_UNIT_CENTS);
    expect(def.pricing.volume).toBe(STAGING_VOLUME_TIERS);
    expect(def.pricing.pack).toBe(STAGING_PACK);
    expect(def.pricing.addon).toMatchObject({ key: "addDescription", cents: STAGING_DESCRIPTION_ADDON_CENTS });
    expect(def.intake.fields.find((f) => f.type === "rooms")?.max).toBe(STAGING_MAX_ROOMS);
    expect(stagingOrderCents(4)).toBe(4900);
    expect(stagingListingCents(10)).toBe(9900);
    expect(stagingListingCents(23)).toBe(9900 * 2 + 4500);
    expect(stagingListingCents(14)).toBe(9900 + 4900);
    expect(STAGING_PRICE_LINE).toContain("$49");
    expect(STAGING_PRICE_LINE).not.toContain("$12");
  });
});
