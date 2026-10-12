import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { STAGING_PRICES, VSAI_PLANS, virtualStagingAiMonth } from "@/content/staging-prices";
import { compareStagingCost, NAR_MEDIAN_STAGING_SERVICE, PER_PHOTO_OPTIONS, SUBSCRIPTION_PLANS } from "@/lib/free/staging-cost";

const page = fs.readFileSync(path.join(process.cwd(), "src/app/free/virtual-staging-cost-calculator/page.tsx"), "utf8");

describe("virtual staging cost calculator", () => {
  it("prices the same companies as the cost guide, from the guide's table", () => {
    const fromGuide = STAGING_PRICES.filter((p) => p.group !== "subscription");
    expect(PER_PHOTO_OPTIONS.map((o) => o.key)).toEqual(fromGuide.map((p) => p.key));
    // nine rows for eight companies (Apply Design has DIY and One-click); Virtual Staging AI, the subscription, is the ninth
    expect(PER_PHOTO_OPTIONS).toHaveLength(9);
    expect(new Set(PER_PHOTO_OPTIONS.map((o) => o.name.replace(/ \(.*\)$/, ""))).size).toBe(8);
    for (const n of [1, 4, 5, 6, 8, 13]) {
      const r = compareStagingCost(n, 1);
      for (const p of fromGuide) expect(r.perPhoto.find((o) => o.key === p.key)!.perListing, `${p.key} × ${n}`).toBe(Math.round(p.listing(n) * 100) / 100);
    }
    // the plans carry the guide's month-to-month prices; billed yearly they are 12 × the yearly monthly price
    for (const plan of SUBSCRIPTION_PLANS) {
      expect(plan.monthly).toBe(virtualStagingAiMonth(plan.photosPerMonth));
      expect(plan.billedYearly).toBe(plan.yearlyPerMonth * 12);
      expect(plan.yearlyPerMonth).toBeLessThan(plan.monthly);
    }
    expect(SUBSCRIPTION_PLANS.map((p) => p.photosPerMonth)).toEqual(VSAI_PLANS.map((p) => p.photosPerMonth));
  });

  it("lists a typical listing cheapest first and names the real cheapest, not ours by default", () => {
    const r = compareStagingCost(5, 1);
    expect(r.photosPerMonth).toBe(5);
    expect(r.perPhoto.map((o) => o.perListing)).toEqual([...r.perPhoto.map((o) => o.perListing)].sort((a, b) => a - b));
    expect(r.perPhoto[0].key).toBe("photoup"); // from $22.50: 3 credits a photo at $1.50
    expect(r.ours.key).toBe("orvionis");
    expect(r.ours.perListing).toBe(49); // the $49 Listing Pack
    expect(r.oneOff).toEqual({ key: "photoup", name: "PhotoUp (AI)", cost: 22.5, from: true });
    // repeated every month, the Basic plan at $16 a month billed yearly beats paying per photo
    expect(r.everyMonth).toMatchObject({ key: "subscription", cost: 16, detail: "billed yearly: $192 up front" });
    expect(r.subscriptionOneOff).toMatchObject({ cost: 25, plan: { name: "Basic" } });
    expect(r.subscription?.unusedPerMonth).toBe(1);
    expect(r.physicalPerMonth).toBe(NAR_MEDIAN_STAGING_SERVICE);
  });

  it("counts one month of a plan, billed monthly, as a way to stage a one-off listing", () => {
    // six photos: one month of the 6-photo plan ($25) is below PhotoUp's $27
    expect(compareStagingCost(6, 1).oneOff).toMatchObject({ key: "subscription", cost: 25, detail: "billed monthly, cancel any time" });
    // eight photos need the 20-photo plan ($35), still below PhotoUp's $36
    expect(compareStagingCost(8, 1).oneOff).toMatchObject({ key: "subscription", cost: 35 });
    // one photo: paying per photo wins
    expect(compareStagingCost(1, 1).oneOff).toMatchObject({ key: "photoup", cost: 4.5 });
  });

  it("moves up the plans with volume and reports when the volume is above the largest plan", () => {
    expect(compareStagingCost(6, 3).subscription?.plan.name).toBe("Standard"); // 18 photos
    expect(compareStagingCost(10, 5).subscription?.plan.name).toBe("Professional"); // 50 photos
    expect(compareStagingCost(10, 15).subscription?.plan.name).toBe("Enterprise"); // 150 photos
    const over = compareStagingCost(10, 16); // 160 photos
    expect(over.subscription).toBeNull();
    expect(over.everyMonth.key).toBe("photoup");
  });

  it("clamps silly inputs instead of breaking", () => {
    expect(compareStagingCost(0, 0).photosPerMonth).toBe(1);
    expect(compareStagingCost(NaN, 2).photosPerListing).toBe(1);
    expect(compareStagingCost(999, 999).photosPerMonth).toBe(900);
    expect(compareStagingCost(2.6, 1).photosPerListing).toBe(3);
  });

  it("prices ORVIONIS with the Listing Pack, in orders of up to 10 photos", () => {
    const orv = (photos: number) => compareStagingCost(photos, 1).ours.perListing;
    expect([orv(1), orv(3), orv(4), orv(5), orv(8), orv(9), orv(10)]).toEqual([15, 45, 49, 49, 79, 89, 99]);
    expect(orv(12)).toBe(99 + 30); // a second order of 2 photos
    expect(orv(15)).toBe(99 + 49);
    expect(compareStagingCost(5, 3).ours.perMonth).toBe(147); // one order per listing
  });

  it("writes the page's prices from the table, not by hand", () => {
    expect(page).not.toMatch(/\$24–\$30|human editor/);
    expect(page).toContain("priceRanges()");
    expect(page).toContain("nine companies");
  });
});
