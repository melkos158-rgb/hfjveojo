/**
 * Categories = who we sell to. "live" lines are results you can order today (they must match a tool in
 * src/lib/tools/definitions); "planned" lines are demand probes — they link to the request form and get built
 * in the order people ask. Keep every line in the shape "what you send → what you get".
 */
export type CategoryInfo = {
  key: string; // tool category key (ToolDefinition.category) or a probe key
  href: string;
  title: string;
  image: string | null;
  alt: string;
  live: string[];
  planned: string[];
  /** Free tools for this audience (lead magnets), shown on the vertical page. */
  free?: Array<{ label: string; href: string }>;
  cta: string;
};

export const CATEGORIES: CategoryInfo[] = [
  {
    key: "real-estate",
    href: "/real-estate",
    image: "/img/hero-real-estate.webp",
    alt: "A phone on a tripod filming a bright, staged living room for a listing walkthrough",
    title: "Real estate",
    live: ["Raw walkthrough → 5 listing clips", "Listing facts → MLS description + social captions"],
    planned: ["Room photos → virtual staging", "Listing files → marketing package"],
    free: [{ label: "Fair housing checker — paste your remarks, see risky phrases and your character count", href: "/free/fair-housing-checker" }],
    cta: "See real-estate tools",
  },
  {
    key: "photography",
    href: "/photographers",
    image: "/img/hero-photographers.webp",
    alt: "A printed photography pricing guide open on a desk next to a camera",
    title: "Photographers",
    live: ["Packages + prices → branded pricing guide (PDF)"],
    planned: ["Your process → client welcome guide", "Business facts → branded documents", "Raw content → social posts"],
    free: [{ label: "Pricing calculator — what to charge per job and per hour from your income goal, costs and real hours", href: "/free/photography-pricing-calculator" }],
    cta: "See photographer tools",
  },
  {
    key: "contractors",
    href: "/contact?topic=contractors",
    image: null,
    alt: "",
    title: "Contractors",
    live: [],
    planned: ["Voice note + photos → proposal", "Job facts → estimate", "Photos → job documentation"],
    cta: "Tell us what you need",
  },
];

export function categoryInfo(key: string): CategoryInfo | undefined {
  return CATEGORIES.find((c) => c.key === key);
}
