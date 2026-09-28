import { describe, expect, it } from "vitest";
import { computePricing, pricingInputsValid, PRICING_PRESETS } from "@/lib/free/pricing-calc";

describe("photography pricing calculator", () => {
  const wedding = { income: 60000, expenses: 14000, taxRate: 25, weeks: 46, hoursPerWeek: 35, shootHours: 8, editHours: 30, jobs: 24 };

  it("grosses income up for tax, caps jobs by capacity and prices per job/hour", () => {
    const r = computePricing(wedding);
    expect(r.revenueNeeded).toBeCloseTo(14000 + 60000 / 0.75, 2); // 94,000
    expect(r.hoursPerJob).toBe(38);
    expect(r.capacity).toBe(Math.floor((46 * 35) / 38)); // 42
    expect(r.jobs).toBe(24);
    expect(r.pricePerJob).toBeCloseTo(94000 / 24, 2);
    expect(r.hourly).toBeCloseTo(94000 / 24 / 38, 2);
    expect(r.overbooked).toBe(false);
    expect(r.scenarios.map((s) => s.jobs)).toEqual([18, 24, 30]);
  });

  it("flags an overbooked plan and prices on the hours that exist", () => {
    const r = computePricing({ ...wedding, jobs: 60 });
    expect(r.overbooked).toBe(true);
    expect(r.jobs).toBe(42);
    expect(r.scenarios[2].feasible).toBe(false);
  });

  it("ships example presets that are valid and fit their own hours", () => {
    expect(PRICING_PRESETS.wedding.v).toEqual(wedding);
    for (const [key, p] of Object.entries(PRICING_PRESETS)) {
      expect(pricingInputsValid(p.v), key).toBe(true);
      const r = computePricing(p.v);
      expect(r.overbooked, key).toBe(false);
      expect(r.jobs, key).toBe(p.v.jobs);
    }
  });

  it("prices the real estate example the way the page describes it", () => {
    const r = computePricing(PRICING_PRESETS["real-estate"].v);
    expect(r.revenueNeeded).toBeCloseTo(14000 + 55000 / 0.75, 2); // 87,333
    expect(r.hoursPerJob).toBe(4);
    expect(r.capacity).toBe(420); // 48 weeks × 35 h ÷ 4 h
    expect(Math.round(r.pricePerJob)).toBe(273);
  });

  it("validates inputs", () => {
    expect(pricingInputsValid(wedding)).toBe(true);
    expect(pricingInputsValid({ ...wedding, weeks: 0 })).toBe(false);
    expect(pricingInputsValid({ ...wedding, income: NaN })).toBe(false);
    expect(pricingInputsValid({ ...wedding, shootHours: 0, editHours: 0 })).toBe(false);
  });
});
