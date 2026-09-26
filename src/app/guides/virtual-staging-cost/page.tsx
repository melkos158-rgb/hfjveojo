import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";

const SLUG = "virtual-staging-cost";
const TITLE = "How much does virtual staging cost in 2026?";
const DESCRIPTION =
  "Per-photo prices, AI subscriptions and what a whole listing costs — real prices checked in September 2026, plus NAR data on what staging does for a sale.";
const CHECKED = "September 26, 2026";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `/guides/${SLUG}` },
  openGraph: { type: "article", title: `${TITLE} | ${site.name}`, description: DESCRIPTION, url: `${site.url}/guides/${SLUG}`, images: [{ url: "/img/sample-virtual-staging-og.jpg", width: 540, height: 630 }] },
};

/** Prices as published by each provider on the day we checked (see Sources). */
const MODELS: Array<{ model: string; example: string; price: string; time: string; bestFor: string }> = [
  {
    model: "Human editor, per photo",
    example: "BoxBrownie",
    price: "US$30 per photo (free changes within 2 months)",
    time: "Under 48 hours (their figure)",
    bestFor: "Complex edits, a designer's eye, no rush",
  },
  {
    model: "Human editor, per photo",
    example: "VirtualStaging.com",
    price: "$24 per photo",
    time: "8–24 hours (their figure)",
    bestFor: "Same, a little faster and cheaper",
  },
  {
    model: "AI subscription",
    example: "Virtual Staging AI",
    price: "$16/month for 6 photos up to $79/month for 150 (≈ $2.67 down to $0.53 per photo)",
    time: "Minutes",
    bestFor: "Teams staging dozens of photos every month",
  },
  {
    model: "AI per photo, no subscription",
    example: "ORVIONIS",
    price: "$15 per photo (2 versions of each)",
    time: "About 2 minutes per photo",
    bestFor: "An agent with a listing now and then; free preview first",
  },
];

const LISTING_COST: Array<{ label: string; perPhoto: number | null; note?: string }> = [
  { label: "Human editor at US$30", perPhoto: 30 },
  { label: "Human editor at $24", perPhoto: 24 },
  { label: "ORVIONIS at $15", perPhoto: 15 },
  { label: "AI subscription", perPhoto: null, note: "$16–19 for the month if the listing fits the plan (6 or 20 photos)" },
];

/** Buyer-intent pricing guide (E10 SEO): every number is sourced and dated; our own offer is described like the others. */
export default function VirtualStagingCostGuide() {
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    dateModified: "2026-09-26",
    author: { "@type": "Organization", name: site.name },
    publisher: { "@type": "Organization", name: site.name },
    mainEntityOfPage: `${site.url}/guides/${SLUG}`,
  };
  return (
    <div className="container-x max-w-3xl py-12 prose-basic">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <p className="eyebrow">Guide · Virtual staging</p>
      <h1 className="mt-3">{TITLE}</h1>
      <p>
        <strong>Short answer:</strong> human-edited virtual staging costs about <strong>$24–$30 per photo</strong> and takes
        from several hours to a few days. AI tools are sold either as a <strong>monthly subscription</strong> ($16–$79 a month,
        under $3 per photo if you use every credit) or <strong>per photo</strong> without a subscription. A typical vacant
        listing needs 4–6 staged rooms, so the total is usually between about $60 and $180 — against a median of $1,500 when
        a staging service furnishes the home for real (NAR). Prices below were checked on {CHECKED}.
      </p>

      <h2>The four ways virtual staging is priced</h2>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-2 pr-3">Model</th>
              <th className="py-2 pr-3">Example</th>
              <th className="py-2 pr-3">Price</th>
              <th className="py-2 pr-3">Turnaround</th>
              <th className="py-2">Best for</th>
            </tr>
          </thead>
          <tbody>
            {MODELS.map((m) => (
              <tr key={m.example} className="border-t border-line align-top">
                <td className="py-2 pr-3">{m.model}</td>
                <td className="py-2 pr-3">{m.example}</td>
                <td className="py-2 pr-3">{m.price}</td>
                <td className="py-2 pr-3">{m.time}</td>
                <td className="py-2">{m.bestFor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>What a whole listing costs</h2>
      <p>Most vacant listings need the living room, the main bedroom and one or two more rooms staged — four to six photos.</p>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-2 pr-3">Option</th>
              <th className="py-2 pr-3">4 rooms</th>
              <th className="py-2">6 rooms</th>
            </tr>
          </thead>
          <tbody>
            {LISTING_COST.map((r) => (
              <tr key={r.label} className="border-t border-line">
                <td className="py-2 pr-3">{r.label}</td>
                {r.perPhoto === null ? (
                  <td className="py-2" colSpan={2}>
                    {r.note}
                  </td>
                ) : (
                  <>
                    <td className="py-2 pr-3">${r.perPhoto * 4}</td>
                    <td className="py-2">${r.perPhoto * 6}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Virtual vs. physical staging</h2>
      <p>
        According to the National Association of REALTORS® 2025 Profile of Home Staging, the median cost of using a staging
        service was <strong>$1,500</strong>, and <strong>$500</strong> when the sellers&apos; agent staged the home
        themselves. The same survey found that 83% of buyers&apos; agents say staging makes it easier for a buyer to picture
        the property as a future home, 49% of sellers&apos; agents saw staging reduce time on market, and 29% reported a 1–10%
        increase in offer value. Those figures are for staging in general, not only virtual staging — but they explain why
        agents stage at all, and virtual staging gets the online photos for a fraction of the price.
      </p>

      <h2>What changes the price</h2>
      <ul>
        <li><strong>Turnaround.</strong> Human editing takes hours to days; AI takes minutes.</li>
        <li><strong>Versions and revisions.</strong> Check how many versions of each photo you get and what a redo costs.</li>
        <li><strong>Clean-up first.</strong> Removing leftover furniture is usually extra — BoxBrownie lists item removal at US$5 for one or two small items and US$10 standard.</li>
        <li><strong>Subscriptions.</strong> The per-photo price of a plan is only low if you use its credits every month.</li>
        <li><strong>Disclosure.</strong> Most MLSs, and California&apos;s AB 723, require staged photos to be disclosed — labeled copies save you time (see the <Link href="/guides/ab-723-virtual-staging">AB 723 checklist</Link>).</li>
        <li><strong>The photo you start with.</strong> A dark, tilted or fisheye photo stages badly at any price (see <Link href="/guides/photographing-rooms-for-virtual-staging">10 photo tips</Link>).</li>
      </ul>

      <h2>How to choose</h2>
      <ul>
        <li>Staging dozens of photos every month? An AI subscription is the cheapest per photo.</li>
        <li>Need a designer to style a difficult room, or several changes at once? A human editing service.</li>
        <li>A listing now and then, and you want it today? Pay per photo — and look at a preview of your own photo before you pay.</li>
      </ul>

      <h2>Our price</h2>
      <p>
        <Link href="/tools/virtual-staging">ORVIONIS Virtual Staging</Link> is $15 per photo, up to six rooms per order, with two
        staged versions of each photo in about two minutes and six styles. Walls, floors and windows stay as photographed; if
        the room&apos;s structure was changed or the result is unusable, one redo is included, otherwise a refund. Every order
        comes with a disclosure pack (labeled copies and a link to the original), and you can see a free watermarked preview of
        your own photo before you pay.
      </p>
      <p>
        <Link href="/tools/virtual-staging#order" className="btn-primary no-underline">
          Stage a photo — $15
        </Link>
      </p>

      <h2>Sources</h2>
      <p className="text-sm">Checked on {CHECKED}. Prices change; follow the links for the current figures.</p>
      <ul className="text-sm">
        <li>
          BoxBrownie pricing (virtual staging US$30; item removal US$5 / US$10):{" "}
          <a href="https://www.boxbrownie.com/pricing" rel="nofollow noopener" target="_blank">boxbrownie.com/pricing</a>
          ; turnaround &ldquo;under 48 hours&rdquo; and free changes within 2 months:{" "}
          <a href="https://www.boxbrownie.com/virtual-staging" rel="nofollow noopener" target="_blank">boxbrownie.com/virtual-staging</a>
        </li>
        <li>
          VirtualStaging.com, &ldquo;How Much Does Virtual Staging Cost?&rdquo; (updated March 2, 2026; $24 per image, 8–24 hours;
          48–72 hours elsewhere):{" "}
          <a href="https://virtualstaging.com/blog/virtual-staging-cost-ultimate-guide/" rel="nofollow noopener" target="_blank">virtualstaging.com</a>
        </li>
        <li>
          Virtual Staging AI plans ($16 / 6 photos to $79 / 150 photos a month):{" "}
          <a href="https://www.virtualstagingai.app/prices" rel="nofollow noopener" target="_blank">virtualstagingai.app/prices</a>
        </li>
        <li>
          NAR 2025 Profile of Home Staging — snapshot (83% of buyers&apos; agents):{" "}
          <a href="https://www.nar.realtor/infographics/2025-profile-of-home-staging-snapshot" rel="nofollow noopener" target="_blank">nar.realtor</a>
          ; median costs and outcomes as reported by Kitchen &amp; Bath Business:{" "}
          <a href="https://kbbonline.com/business-people-news/nar-2025-profile-of-home-staging-released/161855/" rel="nofollow noopener" target="_blank">kbbonline.com</a>
        </li>
      </ul>
    </div>
  );
}
