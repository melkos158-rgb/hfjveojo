/**
 * Every published guide — the /guides hub, the sitemap and the footer read this list, so a new guide is one entry here
 * plus its page under src/app/guides/<slug>/page.tsx.
 */
export type Guide = { slug: string; title: string; description: string; audience: string; updated: string; tool?: { slug: string; label: string } };

export const GUIDES: Guide[] = [
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
    updated: "2026-09-26",
    tool: { slug: "virtual-staging", label: "Virtual Staging — $15 per photo" },
  },
  {
    slug: "photographing-rooms-for-virtual-staging",
    title: "10 tips for room photos that stage well",
    description: "How to shoot empty rooms so virtual staging looks real: light, height, lens, angles and what to leave out.",
    audience: "Agents and listing photographers",
    updated: "2026-09-26",
    tool: { slug: "virtual-staging", label: "Virtual Staging — $15 per photo" },
  },
];
