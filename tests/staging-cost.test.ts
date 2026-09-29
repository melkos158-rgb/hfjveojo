import { describe, expect, it } from "vitest";
import { compareStagingCost, NAR_MEDIAN_STAGING_SERVICE, PER_PHOTO_OPTIONS, SUBSCRIPTION_PLANS } from "@/lib/free/staging-cost";

describe("virtual staging cost calculator", () => {
  it("prices a typical listing per photo and picks the smallest plan that fits", () => {
    const r = compareStagingCost(5, 1);
    expect(r.photosPerMonth).toBe(5);
    expect(r.perPhoto.map((o) => o.perListing)).toEqual([75, 120, 150]);
    expect(r.subscription?.plan.name).toBe("Basic");
    expect(r.subscription?.unusedPerMonth).toBe(1);
    expect(r.physicalPerMonth).toBe(NAR_MEDIAN_STAGING_SERVICE);
  });

  it("keeps a one-off listing on pay-per-photo when a yearly plan costs more up front", () => {
    const r = compareStagingCost(5, 1);
    expect(r.oneOff).toEqual({ key: "orvionis", name: PER_PHOTO_OPTIONS[0].name, cost: 75 });
    // repeated every month, the Basic plan at $16/mo (yearly billing) is cheaper than $75
    expect(r.everyMonth.key).toBe("subscription");
    expect(r.everyMonth.cost).toBe(16);
  });

  it("moves up the plans with volume and reports when the volume is above the largest plan", () => {
    expect(compareStagingCost(6, 3).subscription?.plan.name).toBe("Standard"); // 18 photos
    expect(compareStagingCost(10, 5).subscription?.plan.name).toBe("Professional"); // 50 photos
    expect(compareStagingCost(10, 15).subscription?.plan.name).toBe("Enterprise"); // 150 photos
    const over = compareStagingCost(10, 16); // 160 photos
    expect(over.subscription).toBeNull();
    expect(over.everyMonth.key).toBe("orvionis");
  });

  it("clamps silly inputs instead of breaking", () => {
    expect(compareStagingCost(0, 0).photosPerMonth).toBe(1);
    expect(compareStagingCost(NaN, 2).photosPerListing).toBe(1);
    expect(compareStagingCost(999, 999).photosPerMonth).toBe(900);
    expect(compareStagingCost(2.6, 1).photosPerListing).toBe(3);
  });

  it("keeps the published plan table consistent (yearly bill = 12 × monthly)", () => {
    for (const p of SUBSCRIPTION_PLANS) expect(p.billedYearly).toBe(p.perMonth * 12);
    const sorted = [...PER_PHOTO_OPTIONS].sort((a, b) => a.perPhoto - b.perPhoto);
    expect(sorted).toEqual(PER_PHOTO_OPTIONS);
  });
});
