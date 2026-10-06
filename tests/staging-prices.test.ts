import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  applyDesignCoinsCost,
  bellaListing,
  EXTRAS,
  padstylerListing,
  PRICES_CHECKED,
  priceRanges,
  STAGING_PRICES,
  usd,
  virtualStagingAiMonth,
} from "@/content/staging-prices";
import { GUIDES } from "@/config/guides";

const page = fs.readFileSync(path.join(process.cwd(), "src/app/guides/virtual-staging-cost/page.tsx"), "utf8");

describe("virtual staging cost guide: prices at nine companies", () => {
  it("lists nine companies, each with a source page, and ours written like the others", () => {
    const companies = new Set(STAGING_PRICES.map((p) => p.company.replace(/ \(.*\)$/, "")));
    expect(companies.size).toBe(9);
    for (const p of STAGING_PRICES) {
      expect(p.sources.length, p.key).toBeGreaterThan(0);
      for (const s of p.sources) expect(s.href, p.key).toMatch(/^https:\/\//);
      expect(p.price.length, p.key).toBeGreaterThan(5);
      expect(p.turnaround.length, p.key).toBeGreaterThan(5);
    }
    expect(STAGING_PRICES.filter((p) => p.ours).map((p) => p.key)).toEqual(["orvionis"]);
    expect(EXTRAS.length).toBeGreaterThanOrEqual(4);
  });

  it("works out whole-listing totals from each company's published volume prices", () => {
    expect([bellaListing(1), bellaListing(4), bellaListing(6), bellaListing(21)]).toEqual([37, 140.6, 199.8, 621.6]);
    expect([padstylerListing(1), padstylerListing(4), padstylerListing(6), padstylerListing(8)]).toEqual([34, 124, 162, 184]);
    // 9 coins cost more than a pack of 10 ($90 vs $80); 1.5 coins (one photo) are $15
    expect([applyDesignCoinsCost(1.5), applyDesignCoinsCost(6), applyDesignCoinsCost(9), applyDesignCoinsCost(20)]).toEqual([15, 60, 80, 140]);
    expect([virtualStagingAiMonth(4), virtualStagingAiMonth(6), virtualStagingAiMonth(7), virtualStagingAiMonth(150)]).toEqual([25, 25, 35, 139]);
    const at = (key: string) => STAGING_PRICES.find((p) => p.key === key)!;
    expect([at("orvionis").listing(4), at("orvionis").listing(6)]).toEqual([60, 72]);
    expect([at("styldod").listing(6), at("styldod").listing(8)]).toEqual([138, 128]);
    expect(at("photoup").listing(4)).toBe(18);
  });

  it("quotes ranges in the short answer and FAQ that match the table", () => {
    const r = priceRanges();
    expect(r.designerOnePhoto).toEqual([23, 37]);
    expect(r.designerBulk).toEqual([16, 30]);
    expect(r.aiPerPhoto).toEqual([4.5, 15]);
    expect(r.otherListing).toEqual([18, 80]);
    expect(r.designerListing).toEqual([92, 199.8]);
    // The subscription line in the short answer is written out; keep it in step with Virtual Staging AI's plans.
    expect(page).toContain("$25–$139 a month");
    expect(page).toContain("$16–$79 a month");
    expect(STAGING_PRICES.find((p) => p.key === "virtualstagingai")!.price).toMatch(/\$25 a month .* \$139 .* \$16–\$79/);
  });

  it("formats prices like a person would write them", () => {
    expect([usd(60), usd(4.5), usd(140.6), usd(19.2)]).toEqual(["$60", "$4.50", "$140.60", "$19.20"]);
  });

  it("dates the guide by the day the prices were checked", () => {
    const guide = GUIDES.find((g) => g.slug === "virtual-staging-cost")!;
    expect(guide.updated).toBe("2026-10-06");
    expect(guide.description).toContain(PRICES_CHECKED);
    expect(page).toContain("FAQPage");
    expect(page).toContain("/free/virtual-staging-cost-calculator");
  });
});
