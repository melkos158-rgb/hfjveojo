/**
 * Every published guide — the /guides hub, the sitemap and the footer read this list, so a new guide is one entry here
 * plus its page under src/app/guides/<slug>/page.tsx.
 */
export type Guide = { slug: string; title: string; description: string; audience: string; updated: string; tool?: { slug: string; label: string } };

export const GUIDES: Guide[] = [
  {
    slug: "free-virtual-staging",
    title: "Free virtual staging: what you actually get for free in 2026",
    description: "Which services let you stage a photo free (a first image, a few AI designs, a free upload), the catches to check, and what a whole listing costs after. Checked October 2, 2026.",
    audience: "Real estate agents",
    updated: "2026-10-02",
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
    updated: "2026-10-02",
    tool: { slug: "virtual-staging", label: "Virtual Staging — first photo free" },
  },
  {
    slug: "virtual-staging-cost",
    title: "How much does virtual staging cost in 2026?",
    description: "Human editors charge $24–$30 per photo; AI plans run $16–$79 a month. What a whole listing costs — real prices checked in September 2026, plus NAR data on staging.",
    audience: "Real estate agents",
    updated: "2026-10-02",
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
    updated: "2026-10-02",
    tool: { slug: "virtual-staging", label: "Virtual Staging — first photo free" },
  },
  {
    slug: "photographing-rooms-for-virtual-staging",
    title: "10 tips for room photos that stage well",
    description: "How to shoot empty rooms so virtual staging looks real: light, height, lens, angles and what to leave out.",
    audience: "Agents and listing photographers",
    updated: "2026-10-02",
    tool: { slug: "virtual-staging", label: "Virtual Staging — first photo free" },
  },
];
