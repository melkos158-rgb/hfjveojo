import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";

const SLUG = "free-virtual-staging";
const TITLE = "Free virtual staging: what you actually get for free in 2026";
/** Search-result title: searchers type "free virtual staging" and want to know what is really free. */
const SEO_TITLE = "Free virtual staging in 2026: what's free, and what it costs after";
const DESCRIPTION =
  "Which virtual staging services let you stage a photo free, what each free offer includes, the catches to check, and what a whole listing costs after. Checked October 2, 2026.";
const CHECKED = "October 2, 2026";
const OG_IMAGE = "/img/sample-virtual-staging-og.jpg";

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `/guides/${SLUG}` },
  openGraph: { type: "article", title: `${SEO_TITLE} | ${site.name}`, description: DESCRIPTION, url: `${site.url}/guides/${SLUG}`, images: [{ url: OG_IMAGE, width: 540, height: 630 }] },
};

/** Free offers as each provider publishes them on the day we checked (see Sources). Our own row is written the same way. */
const OFFERS: Array<{ name: string; free: string; terms: string; after: string }> = [
  {
    name: "ORVIONIS (ours)",
    free: "Your first photo: the full result, two staged versions, no watermark",
    terms: "One per person, started by a link in a confirmation email; daily limit; no card",
    after: "$15 per photo, or $49 for a whole listing (up to 5 rooms + the MLS description), $99 for 10",
  },
  {
    name: "Apply Design",
    free: "“First image is free” (auto or DIY staging)",
    terms: "Further conditions are not listed on the pricing page",
    after: "Coins: auto staging is 1.5 coins per photo at $7–$10 a coin (≈ $10.50–$15 per photo)",
  },
  {
    name: "REimagineHome",
    free: "“5 free designs” for new users, “same AI, same quality as paid plans”",
    terms: "The pricing page lists watermark-free images as a paid-plan feature",
    after: "$14/month for 30 credits (Essential plan)",
  },
  {
    name: "Virtual Staging AI",
    free: "“Upload image for free | No sign up | No credit card”",
    terms: "How many free results, and whether they are watermarked, is not stated",
    after: "$16/month for 6 photos (yearly billing)",
  },
  {
    name: "BoxBrownie",
    free: "A free account gets 3 image enhancements and 1 day-to-dusk edit; virtual staging is not included",
    terms: "“No credit card required”",
    after: "Virtual staging $30 per image, under 48 hours",
  },
];

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Is there a completely free virtual staging tool?",
    a: "Several services let you stage one photo or a few designs for free, but none of the ones we checked stages a whole listing for free. Expect to pay once you need four to six rooms, either per photo or with a monthly plan.",
  },
  {
    q: "Can I use a free staged photo in my listing?",
    a: "Usually yes, as long as you disclose it. Most MLSs require virtually staged photos to be labeled, and in California AB 723 has required a disclosure next to the photo and access to the original since January 1, 2026. Check your MLS rules and the service's terms of use.",
  },
  {
    q: "Do free virtual staging results have a watermark?",
    a: "It depends on the service, and several don't say on their pricing page. Look at the free result at full size before you plan around it. Our free first photo has no watermark; our separate instant preview is watermarked and downsized.",
  },
];

/** Search-intent guide (E10): what "free virtual staging" really gets an agent. Sourced, dated, our offer described like the others. */
export default function FreeVirtualStagingGuide() {
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    image: `${site.url}${OG_IMAGE}`,
    datePublished: "2026-10-02",
    dateModified: "2026-10-02",
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: `${site.url}/brand/orvionis-logo-512.png` } },
    mainEntityOfPage: `${site.url}/guides/${SLUG}`,
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <div className="container-x max-w-3xl py-12 prose-basic">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <p className="eyebrow">Guide · Virtual staging</p>
      <h1 className="mt-3">{TITLE}</h1>
      <p>
        <strong>Short answer:</strong> you can get a virtually staged photo for free, but usually just one: a first image, a
        handful of AI designs or a free upload, often with conditions such as an account, a watermark or a lower resolution.
        A vacant listing needs four to six staged rooms, and the rest costs money, from about $10 to $30 a photo or a monthly
        plan. Below is what each free offer includes, as the providers publish it, checked on {CHECKED}. We run one of these
        services, ORVIONIS, and describe ours the same way as the others.
      </p>

      <h2>Free offers, side by side</h2>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-2 pr-3">Service</th>
              <th className="py-2 pr-3">What&apos;s free</th>
              <th className="py-2 pr-3">Conditions (as published)</th>
              <th className="py-2">After the free part</th>
            </tr>
          </thead>
          <tbody>
            {OFFERS.map((o) => (
              <tr key={o.name} className="border-t border-line align-top">
                <td className="py-2 pr-3 font-semibold text-fg">{o.name}</td>
                <td className="py-2 pr-3">{o.free}</td>
                <td className="py-2 pr-3">{o.terms}</td>
                <td className="py-2">{o.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm">
        Offers change often. Where a provider doesn&apos;t state a condition, we say so instead of guessing; follow the links
        under Sources for the current terms.
      </p>

      <h2>Five things to check before you use a free result</h2>
      <ul>
        <li><strong>Resolution and watermark.</strong> Open the result at full size. A small or watermarked image is fine for judging the style, not for the listing.</li>
        <li><strong>The room itself.</strong> Compare it with your original: walls, windows, doors, floors and ceiling fixtures should be exactly as photographed. A staged photo that changes the room misrepresents the property, free or not.</li>
        <li><strong>Disclosure.</strong> Most MLSs want staged photos labeled, and California&apos;s AB 723 requires a disclosure next to the photo plus access to the original (see the <Link href="/guides/ab-723-virtual-staging">AB 723 checklist</Link>).</li>
        <li><strong>Sign-up and renewal.</strong> Note whether the free part needs an account or a card, and whether a plan renews by itself.</li>
        <li><strong>Usage rights.</strong> Check that the terms let you use the image to market the listing.</li>
      </ul>

      <h2>How to get the most out of one free photo</h2>
      <ul>
        <li><strong>Use it on the living room.</strong> Buyers&apos; agents rank it as the room that matters most to stage (37%, NAR 2025; see <Link href="/guides/which-rooms-to-virtually-stage">which rooms to stage first</Link>).</li>
        <li><strong>Start from a good photo.</strong> Straight on, well lit, the whole room in frame; a dark or tilted photo stages badly anywhere (see <Link href="/guides/photographing-rooms-for-virtual-staging">10 photo tips</Link>).</li>
        <li><strong>Run the same photo through two services</strong> and compare the results side by side before you pay for the rest of the listing.</li>
      </ul>

      <h2>When free stops being enough</h2>
      <p>
        One free photo covers one room. For a whole listing, compare what four to six photos cost: a human editor at $24–$30
        a photo, an AI plan for the month, or pay per photo with no subscription. The{" "}
        <Link href="/guides/virtual-staging-cost">virtual staging cost guide</Link> has the prices, and the{" "}
        <Link href="/free/virtual-staging-cost-calculator">free cost calculator</Link> works it out for your number of
        listings.
      </p>

      <h2>Our free first photo</h2>
      <p>
        <Link href="/tools/virtual-staging">ORVIONIS Virtual Staging</Link> stages your first photo free: upload one photo of
        an empty room, leave your email and click the link we send. You get the same order a customer pays for: two staged
        versions of that photo at full resolution, without a watermark, and the disclosure pack (labeled copies and a page with
        the original). It is one photo per person, with a daily limit. After that it&apos;s $15 a photo, or $49 for the
        whole listing (up to five rooms plus the MLS description), $99 for ten, in about two minutes per photo, with no
        subscription.
      </p>
      <p>
        <Link href="/tools/virtual-staging#order" className="btn-primary no-underline">
          Stage your first photo free
        </Link>
      </p>

      <h2>Questions</h2>
      <dl>
        {FAQ.map((f) => (
          <div key={f.q} className="mt-4">
            <dt className="font-semibold text-fg">{f.q}</dt>
            <dd className="mt-1">{f.a}</dd>
          </div>
        ))}
      </dl>

      <h2>Sources</h2>
      <p className="text-sm">Checked on {CHECKED}. Offers change; follow the links for the current terms.</p>
      <ul className="text-sm">
        <li>
          Apply Design pricing (&ldquo;First image is free&rdquo;, coins and prices):{" "}
          <a href="https://www.applydesign.io/pricing" rel="nofollow noopener" target="_blank">applydesign.io/pricing</a>
        </li>
        <li>
          REimagineHome pricing (&ldquo;5 free designs&rdquo;, Essential plan):{" "}
          <a href="https://www.reimaginehome.ai/pricing" rel="nofollow noopener" target="_blank">reimaginehome.ai/pricing</a>
        </li>
        <li>
          Virtual Staging AI (&ldquo;Upload image for free | No sign up | No credit card&rdquo;):{" "}
          <a href="https://www.virtualstagingai.app/" rel="nofollow noopener" target="_blank">virtualstagingai.app</a>
          ; plans:{" "}
          <a href="https://www.virtualstagingai.app/prices" rel="nofollow noopener" target="_blank">virtualstagingai.app/prices</a>
        </li>
        <li>
          BoxBrownie (free account offer; virtual staging $30, under 48 hours):{" "}
          <a href="https://www.boxbrownie.com/virtual-staging" rel="nofollow noopener" target="_blank">boxbrownie.com/virtual-staging</a>
        </li>
        <li>
          NAR 2025 Profile of Home Staging, press release (the rooms buyers&apos; agents rank most important to stage):{" "}
          <a href="https://www.nar.realtor/press-releases/nar-report-reveals-home-staging-boosts-sale-prices-and-reduces-time-on-market" rel="nofollow noopener" target="_blank">nar.realtor</a>
        </li>
      </ul>
    </div>
  );
}
