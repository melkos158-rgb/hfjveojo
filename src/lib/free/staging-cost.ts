/**
 * Virtual staging cost comparison for the free calculator (pure, tested). It prices the visitor's listings at the same
 * nine companies as the cost guide, read from one table (src/content/staging-prices.ts), so the calculator and the guide
 * can't disagree. Update prices there, with the date, and only from a page opened that day.
 */
import { PRICES_CHECKED, STAGING_PRICES, VSAI_PLANS, type PriceGroup, type VsaiPlan } from "@/content/staging-prices";

export const STAGING_PRICES_CHECKED = PRICES_CHECKED;

export type PerPhotoOption = {
  key: string;
  name: string;
  group: Exclude<PriceGroup, "subscription">;
  /** The price as the company publishes it, in one line. */
  priceLine: string;
  turnaround: string;
  /** What `photos` photos of one listing cost, in dollars, bought the cheapest published way. */
  perListingFor: (photos: number) => number;
  /** The published price is a minimum (PhotoUp: "3+ credits" a photo). */
  from?: boolean;
  ours?: boolean;
};

/** Design services and pay-per-photo options, in the guide's order (the calculator sorts them for the visitor's numbers). */
export const PER_PHOTO_OPTIONS: PerPhotoOption[] = STAGING_PRICES.flatMap((p) =>
  p.group === "subscription"
    ? []
    : [
        {
          key: p.key,
          name: p.company,
          group: p.group,
          priceLine: p.price,
          turnaround: p.turnaround,
          perListingFor: p.listing,
          ...(p.onePhotoFrom ? { from: true } : {}),
          ...(p.ours ? { ours: true } : {}),
        },
      ],
);

/** Virtual Staging AI, the subscription in the table. */
export const SUBSCRIPTION_NAME = STAGING_PRICES.find((p) => p.group === "subscription")?.company ?? "Virtual Staging AI";
export type Plan = VsaiPlan & { billedYearly: number };
export const SUBSCRIPTION_PLANS: Plan[] = VSAI_PLANS.map((p) => ({ ...p, billedYearly: p.yearlyPerMonth * 12 }));

/** NAR 2025 Profile of Home Staging: median cost when a staging service staged the home (physical furniture). */
export const NAR_MEDIAN_STAGING_SERVICE = 1500;

export const LIMITS = { photos: { min: 1, max: 30 }, listings: { min: 1, max: 30 } } as const;

const clampInt = (n: number, min: number, max: number) => (Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : min);
const round2 = (n: number) => Math.round(n * 100) / 100;

export type OptionCost = PerPhotoOption & { perListing: number; perMonth: number };
export type Cheapest = { key: string; name: string; cost: number; from?: boolean; detail?: string };

export type StagingCostResult = {
  photosPerListing: number;
  listingsPerMonth: number;
  photosPerMonth: number;
  /** Every design service and pay-per-photo option, cheapest per listing first (ties keep the guide's order). */
  perPhoto: OptionCost[];
  /** ORVIONIS for the same numbers. */
  ours: OptionCost;
  /** One month of the smallest plan that covers one listing, billed month to month (cancel any time). */
  subscriptionOneOff: { plan: Plan; cost: number };
  /** The smallest plan that covers the monthly volume, or null when the volume is above the largest plan. */
  subscription: { plan: Plan; monthly: number; yearlyPerMonth: number; billedYearly: number; perPhotoYearly: number; unusedPerMonth: number } | null;
  /** Physical staging for comparison: NAR median per home × listings. */
  physicalPerMonth: number;
  /** The cheapest way to stage one listing if it is a one-off. */
  oneOff: Cheapest;
  /** The cheapest way if this volume repeats every month (a plan at its yearly-billing price, paid up front). */
  everyMonth: Cheapest;
};

export function compareStagingCost(photosPerListing: number, listingsPerMonth: number): StagingCostResult {
  const p = clampInt(photosPerListing, LIMITS.photos.min, LIMITS.photos.max);
  const l = clampInt(listingsPerMonth, LIMITS.listings.min, LIMITS.listings.max);
  const photosPerMonth = p * l;
  const perPhoto = PER_PHOTO_OPTIONS.map((o) => {
    const perListing = round2(o.perListingFor(p));
    return { ...o, perListing, perMonth: round2(perListing * l) };
  }).sort((a, b) => a.perListing - b.perListing);
  const ours = perPhoto.find((o) => o.ours) ?? perPhoto[0];

  const smallest = (photos: number) => SUBSCRIPTION_PLANS.find((x) => x.photosPerMonth >= photos);
  const oneOffPlan = smallest(p) ?? SUBSCRIPTION_PLANS[SUBSCRIPTION_PLANS.length - 1];
  const subscriptionOneOff = { plan: oneOffPlan, cost: oneOffPlan.monthly };
  const plan = smallest(photosPerMonth);
  const subscription = plan
    ? {
        plan,
        monthly: plan.monthly,
        yearlyPerMonth: plan.yearlyPerMonth,
        billedYearly: plan.billedYearly,
        perPhotoYearly: plan.yearlyPerMonth / photosPerMonth,
        unusedPerMonth: plan.photosPerMonth - photosPerMonth,
      }
    : null;

  const cheapestPerPhoto = perPhoto[0];
  const asCheapest = (o: OptionCost, cost: number): Cheapest => ({ key: o.key, name: o.name, cost, ...(o.from ? { from: true } : {}) });
  // A one-off listing: one month of a plan, billed month to month, against paying per photo.
  const oneOff: Cheapest =
    subscriptionOneOff.cost < cheapestPerPhoto.perListing
      ? { key: "subscription", name: `${SUBSCRIPTION_NAME} ${oneOffPlan.name}, one month`, cost: subscriptionOneOff.cost, detail: "billed monthly, cancel any time" }
      : asCheapest(cheapestPerPhoto, cheapestPerPhoto.perListing);
  // The same volume every month: the plan's yearly-billing price (paid up front) against paying per photo. Every
  // listing costs the same here, so the cheapest per listing is also the cheapest per month.
  const everyMonth: Cheapest =
    subscription && subscription.yearlyPerMonth < cheapestPerPhoto.perMonth
      ? {
          key: "subscription",
          name: `${SUBSCRIPTION_NAME} ${subscription.plan.name}`,
          cost: subscription.yearlyPerMonth,
          detail: `billed yearly: $${subscription.billedYearly.toLocaleString("en-US")} up front`,
        }
      : asCheapest(cheapestPerPhoto, cheapestPerPhoto.perMonth);

  return {
    photosPerListing: p,
    listingsPerMonth: l,
    photosPerMonth,
    perPhoto,
    ours,
    subscriptionOneOff,
    subscription,
    physicalPerMonth: NAR_MEDIAN_STAGING_SERVICE * l,
    oneOff,
    everyMonth,
  };
}
