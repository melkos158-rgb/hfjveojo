/**
 * What real estate photographers charge their agents for virtual staging, read on each photographer's own public price
 * page on the day below (links in `href`), for /guides/virtual-staging-pricing-for-photographers. Update the date and
 * the numbers together, and only from a page opened that day; drop a row whose page no longer shows a price.
 */
export const PHOTOGRAPHER_PRICES_CHECKED = "October 9, 2026";
export const PHOTOGRAPHER_PRICES_CHECKED_ISO = "2026-10-09";

export type PhotographerStagingPrice = {
  business: string;
  area: string;
  /** The virtual staging price as the page words it. */
  price: string;
  /** One staged photo bought alone (a pack-only price divided by its photos), in dollars. */
  perPhoto: number;
  /** The cheapest photo shoot on the same site, in dollars, when the site shows one. */
  shootFrom?: number;
  note?: string;
  href: string;
};

export const PHOTOGRAPHER_PRICES: PhotographerStagingPrice[] = [
  { business: "Wide Angle FL", area: "Orlando, FL", price: "$20 per image", perPhoto: 20, shootFrom: 180, href: "https://wideanglefl.mypixieset.com/prices" },
  { business: "AB3 Visuals", area: "St. Petersburg, FL", price: "$35 per image", perPhoto: 35, shootFrom: 175, href: "https://ab3visuals.com/realestate/" },
  { business: "Coral Cove Media", area: "Jacksonville, FL", price: "$35 per photo", perPhoto: 35, href: "https://www.coralcovemedia.com/pricing" },
  {
    business: "SRQ360",
    area: "Sarasota, FL",
    price: "$75 per scene for 1–2 photos, $65 for 3–9, $50 for 10+",
    perPhoto: 75,
    note: "staged photos within 3 business days",
    href: "https://srq360.com/virtual-staging/",
  },
  { business: "DallasPro", area: "Dallas–Fort Worth, TX", price: "5 rooms for $99", perPhoto: 19.8, shootFrom: 199, note: "sold as a 5-room pack", href: "https://www.dallaspro.com/dallas-fort-worth-photography-pricing" },
  { business: "Key Listing Media", area: "Austin, TX", price: "$40 per image (staging and decluttering)", perPhoto: 40, shootFrom: 175, href: "https://keylistingmedia.com/services/residential/" },
  {
    business: "Shoot2Sell",
    area: "Dallas–Fort Worth, Austin, San Antonio and Houston, TX",
    price: "$60 for one image, $220 for a 4-pack",
    perPhoto: 60,
    note: "24–48 hours after the agent picks photos and style",
    href: "https://shoot2sell.com/virtual-staging",
  },
  { business: "ListerPros", area: "Mesa, AZ", price: "$25 per photo", perPhoto: 25, shootFrom: 139, href: "https://listerpros.com/pricing" },
  { business: "Desert Lens", area: "Phoenix, AZ", price: "$39.99 per photo", perPhoto: 39.99, shootFrom: 149.99, href: "https://desertlens.net/residential-services/" },
  { business: "KC Creative Design Photography", area: "Tucson, AZ", price: "$30 per scene, at least 2 rooms with a shoot", perPhoto: 30, href: "https://www.kccreativedesign.com/realestatevirtualstagingtucson" },
  { business: "KJW Photography", area: "Long Island, NY", price: "$25 per photo", perPhoto: 25, shootFrom: 169, href: "https://kevinjwohlersphotography.zenfolio.com/rephoto" },
  { business: "Lighthouse Visuals", area: "Greenville, NC", price: "$50 per image, 5 for $200", perPhoto: 50, shootFrom: 150, href: "https://lighthousevisuals.com/pricing-guide" },
];

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Low, quartiles, median and high of the one-photo price, and the range of the cheapest shoots, in dollars. */
export function photographerPriceStats(rows: PhotographerStagingPrice[] = PHOTOGRAPHER_PRICES) {
  const p = rows.map((r) => r.perPhoto).sort((a, b) => a - b);
  const half = Math.floor(p.length / 2);
  const shoots = rows.flatMap((r) => (r.shootFrom ? [r.shootFrom] : []));
  return {
    count: rows.length,
    low: p[0],
    high: p[p.length - 1],
    median: median(p),
    q1: median(p.slice(0, half)),
    q3: median(p.slice(p.length % 2 ? half + 1 : half)),
    shootLow: Math.min(...shoots),
    shootHigh: Math.max(...shoots),
    shootCount: shoots.length,
  };
}

/** A dollar amount the way the guide prints it: whole dollars when it is whole, else two decimals. */
export function usd(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}
