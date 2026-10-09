/**
 * Every published guide — the /guides hub, the sitemap and the footer read this list, so a new guide is one entry here
 * plus its page under src/app/guides/<slug>/page.tsx.
 */
/** `updated`: the day the guide last changed (YYYY-MM-DD), or a UTC time (YYYY-MM-DDTHH:MM:SSZ) when the content version already moved that day, so IndexNow sends it again (src/lib/seo/sitemap-entries.ts). Never later than the deploy. */
export type Guide = { slug: string; title: string; description: string; audience: string; updated: string; tool?: { slug: string; label: string } };

export const GUIDES: Guide[] = [
  {
    slug: "virtual-staging-styles",
    title: "Virtual staging styles: one room in six looks",
    description: "Modern, Scandinavian, farmhouse, mid-century, luxury or coastal? The same empty living room staged in all six, what defines each style, and which listings each one suits.",
    audience: "Real estate agents",
    updated: "2026-10-06T10:30:00Z",
    tool: { slug: "virtual-staging", label: "Virtual Staging — first photo free" },
  },
  {
    slug: "free-virtual-staging",
    title: "Free virtual staging: what you actually get for free in 2026",
    description: "Which services let you stage a photo free (a first image, a few AI designs, a free upload), the catches to check, and what a whole listing costs after. Checked October 2, 2026.",
    audience: "Real estate agents",
    updated: "2026-10-06T10:30:00Z",
    tool: { slug: "virtual-staging", label: "Virtual Staging — first photo free" },
  },
  {
    slug: "photography-pricing-guide-checklist",
    title: "What to put in a photography pricing guide: a checklist",
    description: "The 8 sections a photography pricing guide needs — packages, add-ons, process, booking terms and FAQ — what to write in each, and how to check your prices first.",
    audience: "Photographers",
    updated: "2026-09-29",
    tool: { slug: "photographer-pricing-guide", label: "Photographer Pricing Guide — $29" },
  },
  {
    slug: "which-rooms-to-virtually-stage",
    title: "Which rooms should you virtually stage?",
    description: "Buyers' agents rank the living room (37%), primary bedroom (34%) and kitchen (23%) as the rooms that matter most to stage (NAR 2025). A plan for one to six photos, and what to skip.",
    audience: "Real estate agents",
    updated: "2026-10-08T07:40:00Z",
    tool: { slug: "virtual-staging", label: "Virtual Staging — first photo free" },
  },
  {
    slug: "virtual-staging-cost",
    title: "How much does virtual staging cost in 2026?",
    description: "Design services charge $23–$37 for one photo, AI about $4.50–$15 or a monthly plan. Nine companies' prices checked October 6, 2026, what a whole listing costs, and NAR data on staging.",
    audience: "Real estate agents",
    updated: "2026-10-06T11:45:00Z",
    tool: { slug: "virtual-staging", label: "Virtual Staging — first photo free" },
  },
  {
    slug: "fair-housing-words-to-avoid",
    title: "Fair housing words to avoid in listing descriptions",
    description: "What the Fair Housing Act says about ads, what HUD's guidance allows, and the phrases to rewrite — each with a safer alternative.",
    audience: "Real estate agents",
    updated: "2026-09-26",
    tool: { slug: "listing-description", label: "Listing Description — $9" },
  },
  {
    slug: "ab-723-virtual-staging",
    title: "AB 723 and virtual staging: the California checklist",
    description: "What California's AB 723 requires for virtually staged listing photos since January 1, 2026 — and a 7-step checklist.",
    audience: "California agents",
    updated: "2026-10-09T07:15:00Z",
    tool: { slug: "virtual-staging", label: "Virtual Staging — first photo free" },
  },
  {
    slug: "stellar-mls-virtual-staging",
    title: "Virtual staging on Stellar MLS: the Central Florida rules",
    description: "How Stellar MLS wants virtually staged photos disclosed (description, checkbox, remarks), what you may not change, and a 7-step checklist.",
    audience: "Florida agents (Stellar MLS)",
    updated: "2026-10-09T07:15:00Z",
    tool: { slug: "virtual-staging", label: "Virtual Staging — first photo free" },
  },
  {
    slug: "armls-virtual-staging",
    title: "Virtual staging on ARMLS: the Digitally Altered watermark rule",
    description: "How ARMLS wants staged photos disclosed since May 28, 2026: the Flexmls Digitally Altered watermark, the original next to it, the $200 fines from December, a checklist.",
    audience: "Arizona agents (ARMLS)",
    updated: "2026-10-09T07:15:00Z",
    tool: { slug: "virtual-staging", label: "Virtual Staging — first photo free" },
  },
  {
    slug: "virtual-staging-pricing-for-photographers",
    title: "What real estate photographers charge for virtual staging",
    description: "Twelve photographers' own price lists, checked October 9, 2026: $19.80–$75 for a staged photo, median $35. What it costs you, how to price it, and how to deliver it compliant.",
    audience: "Real estate photographers",
    updated: "2026-10-09T13:15:00Z",
    tool: { slug: "pro-credits", label: "Pro credits — 25 rooms for $149" },
  },
  {
    slug: "photographing-rooms-for-virtual-staging",
    title: "10 tips for room photos that stage well",
    description: "How to shoot empty rooms so virtual staging looks real: light, height, lens, angles and what to leave out.",
    audience: "Agents and listing photographers",
    updated: "2026-10-04",
    tool: { slug: "virtual-staging", label: "Virtual Staging — first photo free" },
  },
];
