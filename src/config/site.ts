/**
 * Public site configuration (safe for the browser). Legal identity fields MUST be verified by a human
 * before launch — see docs/LEGAL_FLAGS.md. Values marked VERIFY are placeholders, not legal facts.
 */
export const site = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "ORVIONIS",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://orvionis.com",
  tagline: "Upload what you have. Get the finished result.",
  description:
    "ORVIONIS turns what you already have into finished, branded deliverables: listing clips for real-estate agents, pricing guides for photographers, and more. Fixed price per result, no subscription.",
  supportEmail: "hello@orvionis.com",
  legal: {
    entityName: "ORVIONIS (sole proprietorship) — VERIFY legal entity name",
    address: "VERIFY registered address",
    country: "Poland — VERIFY",
    governingLaw: "VERIFY governing law and venue",
    vatNote: "VERIFY VAT / OSS obligations for digital services sold to EU consumers",
    /** Safeguards for providers outside the EEA (DPAs / Standard Contractual Clauses / Data Privacy Framework): the owner confirms per provider. */
    transfersNote: "VERIFY the safeguard used for each provider outside the EEA (data processing agreement with Standard Contractual Clauses or EU–US Data Privacy Framework)",
    lastUpdated: "2026-09-26",
  },
  social: {
    instagram: "",
    tiktok: "",
    youtube: "",
  },
  verticals: [
    { slug: "real-estate", name: "Real estate", blurb: "Listing clips, captions and marketing copy for agents." },
    { slug: "photographers", name: "Photographers", blurb: "Pricing guides and client documents in your brand." },
  ],
} as const;
