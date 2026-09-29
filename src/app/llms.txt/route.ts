import { site } from "@/config/site";
import { GUIDES } from "@/config/guides";
import { liveCatalog, type CatalogItem } from "@/lib/tools/catalog";
import { formatUsd } from "@/lib/ai/pricing";

export const dynamic = "force-dynamic";

/**
 * Optional publisher guide at /llms.txt (the llmstxt.org community proposal): a short, curated map of our public pages
 * for clients that choose to read it. Built from the same sources as /pricing and /guides, so prices and titles never
 * drift from the site. It is not a crawler control (that is robots.txt) and not a ranking or citation lever — Google
 * documents that it ignores the file for Search.
 */
export async function GET(): Promise<Response> {
  const catalog = await liveCatalog();
  const url = (path: string) => `${site.url}${path}`;
  const price = (c: CatalogItem) =>
    formatUsd(c.priceCents).replace(/\.00$/, "") + (c.def.quantity && c.def.pricing.unit ? ` per ${c.def.pricing.unit.one}` : "");
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    "Prices are in US dollars and paid once per order through Stripe; there is no subscription. The site is in English. Staged photos, listing descriptions and pricing guides are made with AI (OpenAI models) and checked automatically; listing clips are edited by a person.",
    "",
    "## Tools",
    "",
    ...catalog.map(
      (c) => `- [${c.def.name}](${url(`/tools/${c.def.slug}`)}): ${price(c)}. You provide: ${c.def.io.input}. You get: ${c.def.io.output}. Time: ${c.def.io.processingTime}.`,
    ),
    "",
    "## Guides",
    "",
    ...GUIDES.map((g) => `- [${g.title}](${url(`/guides/${g.slug}`)}): ${g.description}`),
    "",
    "## Free tools",
    "",
    `- [Fair housing checker](${url("/free/fair-housing-checker")}): paste listing remarks to see risky fair-housing phrases with a rewrite hint and a character count; runs in the browser, no sign-up.`,
    `- [Virtual staging cost calculator](${url("/free/virtual-staging-cost-calculator")}): photos per listing and listings per month → the cost with human editors, AI subscriptions and pay-per-photo AI, from published prices with sources; runs in the browser.`,
    `- [Photography pricing calculator](${url("/free/photography-pricing-calculator")}): the minimum price per job and per hour from your income target, costs, tax rate and hours, with real estate, wedding, portrait and commercial examples and sourced US market rates for wedding and real estate photography; runs in the browser.`,
    "",
    "## Policies",
    "",
    `- [Pricing](${url("/pricing")}): every tool's price, inputs and delivery time on one page.`,
    `- [Refund policy](${url("/refund-policy")}): when an order is refunded and how to ask.`,
    `- [Terms of Service](${url("/terms")}): the terms for orders, deliverables and liability.`,
    `- [Privacy Policy](${url("/privacy")}): what is collected, which providers process it and for how long.`,
    "",
    "## Optional",
    "",
    `- [Real estate agents](${url("/real-estate")}): the real-estate tools on one page.`,
    `- [Photographers](${url("/photographers")}): the pricing guide tool for photographers.`,
    `- [Contact](${url("/contact")}): questions, and requests for results we don't offer yet (${site.supportEmail}).`,
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
