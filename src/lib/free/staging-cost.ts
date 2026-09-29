/**
 * Virtual staging cost comparison for the free calculator (pure, tested). Every price is as published by the provider on
 * the day it was checked; the page lists the sources. Update the date and the numbers together.
 */
export const STAGING_PRICES_CHECKED = "September 29, 2026";

export type PerPhotoOption = { key: string; name: string; perPhoto: number; note: string };

/** Pay-per-photo options, cheapest first. */
export const PER_PHOTO_OPTIONS: PerPhotoOption[] = [
  { key: "orvionis", name: "ORVIONIS (AI, 2 versions of each photo)", perPhoto: 15, note: "About 2 minutes per photo, no subscription" },
  { key: "virtualstaging-com", name: "VirtualStaging.com (human editor)", perPhoto: 24, note: "8–24 hours" },
  { key: "boxbrownie", name: "BoxBrownie (human editor)", perPhoto: 30, note: "Under 48 hours, free changes within 2 months" },
];

/** Virtual Staging AI plans as listed with yearly billing ("$16/mo with yearly billing, billed as $192 yearly"). */
export type Plan = { name: string; perMonth: number; photosPerMonth: number; billedYearly: number };
export const SUBSCRIPTION_PLANS: Plan[] = [
  { name: "Basic", perMonth: 16, photosPerMonth: 6, billedYearly: 192 },
  { name: "Standard", perMonth: 19, photosPerMonth: 20, billedYearly: 228 },
  { name: "Professional", perMonth: 39, photosPerMonth: 60, billedYearly: 468 },
  { name: "Enterprise", perMonth: 79, photosPerMonth: 150, billedYearly: 948 },
];

/** NAR 2025 Profile of Home Staging: median cost when a staging service staged the home (physical furniture). */
export const NAR_MEDIAN_STAGING_SERVICE = 1500;

export const LIMITS = { photos: { min: 1, max: 30 }, listings: { min: 1, max: 30 } } as const;

const clampInt = (n: number, min: number, max: number) => (Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : min);

export type StagingCostResult = {
  photosPerListing: number;
  listingsPerMonth: number;
  photosPerMonth: number;
  perPhoto: Array<PerPhotoOption & { perListing: number; perMonth: number }>;
  /** The smallest plan that covers the monthly volume, or null when the volume is above the largest plan. */
  subscription: { plan: Plan; perMonth: number; billedYearly: number; perPhoto: number; unusedPerMonth: number } | null;
  /** Physical staging for comparison: NAR median per home × listings. */
  physicalPerMonth: number;
  /** Cheapest way to stage one listing if it is a one-off (a yearly plan is paid in full up front). */
  oneOff: { key: string; name: string; cost: number };
  /** Cheapest way if this volume repeats every month (plans compared at their monthly price with yearly billing). */
  everyMonth: { key: string; name: string; cost: number };
};

export function compareStagingCost(photosPerListing: number, listingsPerMonth: number): StagingCostResult {
  const p = clampInt(photosPerListing, LIMITS.photos.min, LIMITS.photos.max);
  const l = clampInt(listingsPerMonth, LIMITS.listings.min, LIMITS.listings.max);
  const photosPerMonth = p * l;
  const perPhoto = PER_PHOTO_OPTIONS.map((o) => ({ ...o, perListing: o.perPhoto * p, perMonth: o.perPhoto * photosPerMonth }));
  const plan = SUBSCRIPTION_PLANS.find((x) => x.photosPerMonth >= photosPerMonth);
  const subscription = plan
    ? { plan, perMonth: plan.perMonth, billedYearly: plan.billedYearly, perPhoto: plan.perMonth / photosPerMonth, unusedPerMonth: plan.photosPerMonth - photosPerMonth }
    : null;

  const cheapestPerPhoto = perPhoto[0];
  // A one-off listing: a plan only helps if its whole yearly bill is below the per-photo cost of that one listing.
  const oneOffPlan = SUBSCRIPTION_PLANS.find((x) => x.photosPerMonth >= p);
  const oneOff =
    oneOffPlan && oneOffPlan.billedYearly < cheapestPerPhoto.perListing
      ? { key: "subscription", name: `Virtual Staging AI ${oneOffPlan.name} (billed yearly)`, cost: oneOffPlan.billedYearly }
      : { key: cheapestPerPhoto.key, name: cheapestPerPhoto.name, cost: cheapestPerPhoto.perListing };
  const everyMonth =
    subscription && subscription.perMonth < cheapestPerPhoto.perMonth
      ? { key: "subscription", name: `Virtual Staging AI ${subscription.plan.name} (yearly billing)`, cost: subscription.perMonth }
      : { key: cheapestPerPhoto.key, name: cheapestPerPhoto.name, cost: cheapestPerPhoto.perMonth };

  return { photosPerListing: p, listingsPerMonth: l, photosPerMonth, perPhoto, subscription, physicalPerMonth: NAR_MEDIAN_STAGING_SERVICE * l, oneOff, everyMonth };
}
