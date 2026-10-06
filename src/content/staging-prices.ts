import { STAGING_PRICE_LINE, stagingListingCents } from "@/config/staging-pricing";

/**
 * Virtual staging prices at nine companies, for the cost guide (/guides/virtual-staging-cost). Every figure is what the
 * company published for US customers on the day we checked, read on its own pricing page (links in `source`). Update the
 * date and the numbers together, and only from a page you have opened that day. Our own row is written the same way.
 */
export const PRICES_CHECKED = "October 6, 2026";
export const PRICES_CHECKED_ISO = "2026-10-06";

export type PriceGroup = "designer" | "per-photo" | "subscription";

export const GROUP_LABEL: Record<PriceGroup, string> = {
  designer: "Design services: a designer or editor stages each photo",
  "per-photo": "Pay per photo: AI or do it yourself",
  subscription: "AI subscription",
};

export type Source = { label: string; href: string };

export type StagingPrice = {
  key: string;
  company: string;
  group: PriceGroup;
  /** What one photo costs if it is all you order, in dollars. */
  onePhoto: number;
  /** The published price is a minimum (PhotoUp: "3+ credits" a photo). */
  onePhotoFrom?: boolean;
  /** Design services: the lowest published per-photo price for a bigger order. */
  bulkPerPhoto?: number;
  /** One line under the bar in the one-photo chart. */
  onePhotoNote: string;
  /** The price as published, in one line. */
  price: string;
  turnaround: string;
  notes: string;
  /** What `photos` photos of one listing cost, in dollars, bought the cheapest published way. */
  listing: (photos: number) => number;
  /** Shown under the name in the whole-listing table when the total needs a word of explanation. */
  listingNote?: string;
  ours?: boolean;
  sources: Source[];
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Bella: $37 a photo, 5% off from 3 photos, 10% from 6, 15% from 11, 20% from 21 (applied to every photo). */
export function bellaListing(photos: number): number {
  const off = photos >= 21 ? 0.2 : photos >= 11 ? 0.15 : photos >= 6 ? 0.1 : photos >= 3 ? 0.05 : 0;
  return round2(photos * 37 * (1 - off));
}

/** Padstyler Bespoke: $34 for one photo, $31 each from 2, $27 from 5, $23 from 8. */
export function padstylerListing(photos: number): number {
  return photos * (photos >= 8 ? 23 : photos >= 5 ? 27 : photos >= 2 ? 31 : 34);
}

/** Apply Design coins: $10 each when you buy up to 9, $8 for 10–19, $7 for 20 or more. The cheapest way to get `coins`. */
export function applyDesignCoinsCost(coins: number): number {
  const priceAt = (q: number) => (q >= 20 ? 7 : q >= 10 ? 8 : 10);
  const candidates = [coins, Math.max(coins, 10), Math.max(coins, 20)];
  return round2(Math.min(...candidates.map((q) => q * priceAt(q))));
}

/** Virtual Staging AI billed month to month: one month of the smallest plan that covers the photos. */
const VSAI_MONTHLY = [
  { photos: 6, usd: 25 },
  { photos: 20, usd: 35 },
  { photos: 60, usd: 79 },
  { photos: 150, usd: 139 },
];
export function virtualStagingAiMonth(photos: number): number {
  return (VSAI_MONTHLY.find((p) => p.photos >= photos) ?? VSAI_MONTHLY[VSAI_MONTHLY.length - 1]).usd;
}

export const STAGING_PRICES: StagingPrice[] = [
  {
    key: "styldod",
    bulkPerPhoto: 16,
    company: "Styldod",
    group: "designer",
    onePhoto: 23,
    onePhotoNote: "$16 each from 8 photos, 24–48 hours",
    price: "$23 a photo; $16 each from 8 photos",
    turnaround: "24–48 hours; +$6 a photo for 24 hours, +$12 for 12 hours",
    notes: "Unlimited free revisions",
    listing: (n) => n * (n >= 8 ? 16 : 23),
    sources: [{ label: "styldod.com/virtual-staging", href: "https://www.styldod.com/virtual-staging" }],
  },
  {
    key: "virtualstaging-com",
    bulkPerPhoto: 19.2,
    company: "VirtualStaging.com",
    group: "designer",
    onePhoto: 24,
    onePhotoNote: "$19.20 with their bulk discount, 24 hours",
    price: "$24 a photo; $19.20 with their bulk discount",
    turnaround: "24 hours; 4–8-hour rush available",
    notes: "Unlimited revisions",
    listing: (n) => n * 24,
    listingNote: "at $24; the page doesn't say from how many photos the bulk price starts",
    sources: [{ label: "virtualstaging.com/pricing", href: "https://virtualstaging.com/pricing" }],
  },
  {
    key: "boxbrownie",
    bulkPerPhoto: 30,
    company: "BoxBrownie",
    group: "designer",
    onePhoto: 30,
    onePhotoNote: "the same price for any number, under 48 hours",
    price: "US$30 a photo",
    turnaround: "Under 48 hours",
    notes: "Free changes within 2 months",
    listing: (n) => n * 30,
    sources: [
      { label: "boxbrownie.com/pricing", href: "https://www.boxbrownie.com/pricing" },
      { label: "boxbrownie.com/virtual-staging", href: "https://www.boxbrownie.com/virtual-staging" },
    ],
  },
  {
    key: "padstyler",
    bulkPerPhoto: 23,
    company: "Padstyler (Bespoke)",
    group: "designer",
    onePhoto: 34,
    onePhotoNote: "$23 each from 8 photos, 24–48 hours",
    price: "$34 for one photo; $31 each from 2, $27 from 5, $23 from 8",
    turnaround: "24–48 hours",
    notes: "Unlimited design revisions",
    listing: padstylerListing,
    sources: [
      { label: "padstyler.com (purchase page)", href: "https://www.padstyler.com/index.php?page=purchase" },
      { label: "padstyler.com", href: "https://www.padstyler.com/" },
    ],
  },
  {
    key: "bella",
    bulkPerPhoto: 29.6,
    company: "Bella Virtual Staging",
    group: "designer",
    onePhoto: 37,
    onePhotoNote: "5–20% off from 3 photos, 24–48 hours",
    price: "$37 a photo; 5% off from 3 photos, 10% from 6, 15% from 11, 20% from 21",
    turnaround: "24–48 hours",
    notes: "Staged by an interior designer, “never AI” (their words); unlimited revisions for two weeks",
    listing: bellaListing,
    sources: [{ label: "bellavirtual.com/pages/pricing", href: "https://www.bellavirtual.com/pages/pricing" }],
  },
  {
    key: "photoup",
    company: "PhotoUp (AI)",
    group: "per-photo",
    onePhoto: 4.5,
    onePhotoFrom: true,
    onePhotoNote: "3 or more credits at $1.50; less with credit packs",
    price: "“3+ credits” a photo; credits cost $1.50 on demand, $1.10–$1.30 in packs",
    turnaround: "Not stated on the pricing page",
    notes: "5 free credits to start",
    listing: (n) => round2(n * 3 * 1.5),
    listingNote: "at least: 3 credits a photo at $1.50",
    sources: [{ label: "photoup.net/pricing", href: "https://www.photoup.net/pricing" }],
  },
  {
    key: "applydesign-diy",
    company: "Apply Design (DIY)",
    group: "per-photo",
    onePhoto: 10,
    onePhotoNote: "you place the furniture yourself; $7 a coin from 20",
    price: "1 coin a photo; coins are $10 each up to 9, $8 for 10–19, $7 for 20 or more",
    turnaround: "As long as you take; you arrange the furniture in their editor",
    notes: "First image free; unlimited DIY revisions",
    listing: (n) => applyDesignCoinsCost(n),
    sources: [{ label: "applydesign.io/pricing", href: "https://www.applydesign.io/pricing" }],
  },
  {
    key: "applydesign-oneclick",
    company: "Apply Design (One-click)",
    group: "per-photo",
    onePhoto: 15,
    onePhotoNote: "1.5 coins; $10.50 when coins are $7",
    price: "1.5 coins a photo ($10.50–$15)",
    turnaround: "15 minutes",
    notes: "First image free; item removal included",
    listing: (n) => applyDesignCoinsCost(1.5 * n),
    listingNote: "coins bought the cheapest way (9 coins cost more than a pack of 10)",
    sources: [{ label: "applydesign.io/pricing", href: "https://www.applydesign.io/pricing" }],
  },
  {
    key: "orvionis",
    company: "ORVIONIS (ours)",
    group: "per-photo",
    onePhoto: 15,
    onePhotoNote: "2 versions of each photo, about 2 minutes",
    price: STAGING_PRICE_LINE,
    turnaround: "About 2 minutes",
    notes: "Two versions of each photo; MLS description included from 4 rooms; one redo or a refund if the room's structure was changed; first photo free",
    listing: (n) => stagingListingCents(n) / 100,
    ours: true,
    sources: [{ label: "orvionis.com/tools/virtual-staging", href: "https://orvionis.com/tools/virtual-staging" }],
  },
  {
    key: "virtualstagingai",
    company: "Virtual Staging AI",
    group: "subscription",
    onePhoto: 25,
    onePhotoNote: "one month of the 6-photo plan, billed monthly",
    price: "$25 a month for 6 photos up to $139 for 150, billed monthly; $16–$79 a month with yearly billing ($192–$948 a year up front)",
    turnaround: "About 10 seconds (their figure)",
    notes: "Cancel anytime; $0.53–$4.17 a photo if you use every credit",
    listing: virtualStagingAiMonth,
    listingNote: "one month of the smallest plan that fits, billed monthly",
    sources: [{ label: "virtualstagingai.app/prices", href: "https://www.virtualstagingai.app/prices" }],
  },
];

/** Extras that change the bill, as each company publishes them. */
export const EXTRAS: Array<{ extra: string; prices: string }> = [
  {
    extra: "Faster delivery",
    prices: "Styldod: +$6 a photo for 24 hours, +$12 for 12 hours. VirtualStaging.com: 4–8-hour rush (price not listed).",
  },
  {
    extra: "Removing leftover furniture or clutter first",
    prices: "VirtualStaging.com: from $0.50. BoxBrownie: US$5 for one or two small items, US$10 standard. Bella: $15 a photo. Apply Design One-click: included.",
  },
  {
    extra: "Virtual renovation (new floors, walls or finishes)",
    prices: "Padstyler: from $49. Bella: $69 a photo. VirtualStaging.com: $90 a photo inside, $140 outside.",
  },
  {
    extra: "360° photos",
    prices: "VirtualStaging.com: $32 per 360° photo. Bella: $99 per tour plus $37 per staged 360° photo. Apply Design One-click: 2.5 coins.",
  },
];

/** Dollars as a price: $60, $4.50, $140.60. */
export function usd(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

const byGroup = (g: PriceGroup) => STAGING_PRICES.filter((p) => p.group === g);

/** The ranges the guide quotes in its short answer and FAQ, computed from the table so the text can't drift from it. */
export function priceRanges() {
  const designers = byGroup("designer");
  const nonDesigner = STAGING_PRICES.filter((p) => p.group !== "designer");
  const perPhotoAi = byGroup("per-photo").filter((p) => p.key !== "applydesign-diy");
  const min = (xs: number[]) => Math.min(...xs);
  const max = (xs: number[]) => Math.max(...xs);
  return {
    designerOnePhoto: [min(designers.map((p) => p.onePhoto)), max(designers.map((p) => p.onePhoto))] as const,
    designerBulk: [min(designers.map((p) => p.bulkPerPhoto ?? p.onePhoto)), max(designers.map((p) => p.bulkPerPhoto ?? p.onePhoto))] as const,
    aiPerPhoto: [min(perPhotoAi.map((p) => p.onePhoto)), max(perPhotoAi.map((p) => p.onePhoto))] as const,
    /** A listing of 4–6 photos. */
    designerListing: [min(designers.map((p) => p.listing(4))), max(designers.map((p) => p.listing(6)))] as const,
    otherListing: [min(nonDesigner.map((p) => p.listing(4))), max(nonDesigner.map((p) => p.listing(6)))] as const,
  };
}
