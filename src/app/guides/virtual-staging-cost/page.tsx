import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { EXTRAS, GROUP_LABEL, PRICES_CHECKED, PRICES_CHECKED_ISO, STAGING_PRICES, priceRanges, usd, type PriceGroup } from "@/content/staging-prices";

const SLUG = "virtual-staging-cost";
const TITLE = "How much does virtual staging cost in 2026?";
/** Search-result title: the answer's shape up front (searchers compare per-photo prices across companies). */
const SEO_TITLE = "Virtual staging cost in 2026: prices per photo at 9 companies";
const R = priceRanges();
const range = ([a, b]: readonly [number, number], round = false) => `${usd(round ? Math.round(a) : a)}–${usd(round ? Math.round(b) : b)}`;
const DESCRIPTION = `Virtual staging costs ${range(R.designerOnePhoto)} a photo from a design service and about ${range(R.aiPerPhoto)} with AI, or a monthly plan. Nine companies' prices checked ${PRICES_CHECKED}.`;
const OG_IMAGE = "/img/sample-virtual-staging-og.jpg";

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `/guides/${SLUG}` },
  openGraph: { type: "article", title: `${SEO_TITLE} | ${site.name}`, description: DESCRIPTION, url: `${site.url}/guides/${SLUG}`, images: [{ url: OG_IMAGE, width: 540, height: 630 }] },
};

const GROUPS: PriceGroup[] = ["designer", "per-photo", "subscription"];
const ONE_PHOTO = [...STAGING_PRICES].sort((a, b) => a.onePhoto - b.onePhoto || Number(!!a.ours) - Number(!!b.ours));
const MAX_ONE_PHOTO = Math.max(...STAGING_PRICES.map((p) => p.onePhoto));
const LISTINGS = [...STAGING_PRICES].sort((a, b) => a.listing(4) - b.listing(4) || a.listing(6) - b.listing(6));

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "How much does virtual staging cost per photo?",
    a: `${range(R.designerOnePhoto)} for a single photo from the five design services we checked on ${PRICES_CHECKED}, and ${range(R.designerBulk)} a photo on bigger orders. AI services charge about ${range(R.aiPerPhoto)} a photo, and an AI subscription starts at $25 a month for 6 photos ($16 a month if you pay for the year up front).`,
  },
  {
    q: "How much does it cost to virtually stage a whole house?",
    a: `Most vacant listings need four to six staged photos. At the prices we checked that is about ${range(R.otherListing, true)} with an AI service or a do-it-yourself editor, and ${range(R.designerListing, true)} with a design service.`,
  },
  {
    q: "Is virtual staging cheaper than traditional staging?",
    a: `For the listing photos, by far. The median cost of using a staging service was $1,500 in NAR's 2025 Profile of Home Staging, against ${usd(Math.round(R.otherListing[0]))}–${usd(Math.round(R.designerListing[1]))} to stage four to six photos virtually. Physical staging also furnishes the home for showings, which virtual staging doesn't.`,
  },
  {
    q: "Why do prices range from under $5 to $37 a photo?",
    a: "Mostly who does the work and how fast. A designer or editor stages each photo by hand in one to two days; AI does it in seconds or minutes. Then compare what the price includes: how many versions you get, whether revisions are free, and whether clearing leftover furniture costs extra.",
  },
  {
    q: "Do I have to disclose virtually staged photos?",
    a: "Usually, yes. Most MLSs require virtually staged photos to be labeled, and in California AB 723 has required a disclosure next to the photo and access to the original since January 1, 2026. Check your MLS rules before you upload.",
  },
];

/** Buyer-intent pricing guide (E10 SEO): every number is sourced and dated; our own offer is described like the others. */
export default function VirtualStagingCostGuide() {
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    image: `${site.url}${OG_IMAGE}`,
    datePublished: "2026-09-26",
    dateModified: PRICES_CHECKED_ISO,
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: `${site.url}/brand/orvionis-logo-512.png` } },
    mainEntityOfPage: `${site.url}/guides/${SLUG}`,
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  // One line per company in Sources ("Apply Design (DIY)" and "(One-click)" share a page).
  const sources = STAGING_PRICES.filter((p) => !p.ours)
    .map((p) => ({ key: p.key, name: p.company.replace(/ \(.*\)$/, ""), sources: p.sources }))
    .filter((p, i, all) => all.findIndex((q) => q.name === p.name) === i);
  return (
    <div className="container-x max-w-3xl py-12 prose-basic">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <p className="eyebrow">Guide · Virtual staging</p>
      <h1 className="mt-3">{TITLE}</h1>
      <p>
        <strong>Short answer:</strong> a design service charges <strong>{range(R.designerOnePhoto)} for one photo</strong>{" "}
        ({range(R.designerBulk)} a photo on bigger orders) and takes one to two days. AI costs about{" "}
        <strong>{range(R.aiPerPhoto)} a photo</strong> when you pay per photo, or <strong>$25–$139 a month</strong> as a
        subscription ($16–$79 a month if you pay for the year up front). A vacant listing usually needs four to six staged
        photos, so a whole listing costs about <strong>{range(R.otherListing, true)}</strong> with AI and{" "}
        <strong>{range(R.designerListing, true)}</strong> with a design service, against a median of $1,500 when a staging
        service furnishes the home for real (NAR). These are the prices nine companies published on {PRICES_CHECKED}. We run
        one of them, ORVIONIS, and list ours the same way as the others.
      </p>

      <h2>One photo, today: what it costs</h2>
      <p>If one empty room is all you need staged right now, this is what you pay at each company, cheapest first.</p>
      <ol className="not-prose my-5 space-y-3" aria-label="Price of one staged photo by company">
        {ONE_PHOTO.map((p) => (
          <li key={p.key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className={p.ours ? "font-semibold text-accent" : "text-fg"}>{p.company}</span>
              <span className="font-semibold whitespace-nowrap text-fg">
                {p.onePhotoFrom ? "from " : ""}
                {usd(p.onePhoto)}
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-card-2" aria-hidden="true">
              <div className={`h-2 rounded-full ${p.ours ? "bg-accent" : "bg-gray-400"}`} style={{ width: `${Math.max(3, (p.onePhoto / MAX_ONE_PHOTO) * 100)}%` }} />
            </div>
            <div className="mt-0.5 text-xs text-gray-500">{p.onePhotoNote}</div>
          </li>
        ))}
      </ol>

      <h2>Prices at nine companies</h2>
      <p>
        Four ways to buy it: a design service per photo, AI per photo, a do-it-yourself editor where you place the furniture,
        or an AI subscription. Checked on {PRICES_CHECKED}, in US dollars, as each company publishes it.
      </p>
      <div className="not-prose overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr>
              <th className="py-2 pr-3">Company</th>
              <th className="py-2 pr-3">Price</th>
              <th className="py-2 pr-3">Turnaround</th>
              <th className="py-2">Included / notes</th>
            </tr>
          </thead>
          {GROUPS.map((g) => (
            <tbody key={g}>
              <tr className="border-t border-line">
                <th colSpan={4} scope="colgroup" className="pt-4 pb-1 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  {GROUP_LABEL[g]}
                </th>
              </tr>
              {STAGING_PRICES.filter((p) => p.group === g).map((p) => (
                <tr key={p.key} className="border-t border-line align-top">
                  <td className={`py-2 pr-3 font-semibold ${p.ours ? "text-accent" : "text-fg"}`}>{p.company}</td>
                  <td className="py-2 pr-3">{p.price}</td>
                  <td className="py-2 pr-3">{p.turnaround}</td>
                  <td className="py-2">{p.notes}</td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>

      <h2>What a whole listing costs</h2>
      <p>
        Most vacant listings need the living room, the main bedroom and one to three more rooms staged: four to six photos
        (see <Link href="/guides/which-rooms-to-virtually-stage">which rooms to stage first</Link>). Totals use each
        company&apos;s volume price where it has one, and leave out free first images.
      </p>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-2 pr-3">Company</th>
              <th className="py-2 pr-3">4 photos</th>
              <th className="py-2">6 photos</th>
            </tr>
          </thead>
          <tbody>
            {LISTINGS.map((p) => (
              <tr key={p.key} className="border-t border-line align-top">
                <td className="py-2 pr-3">
                  <span className={p.ours ? "font-semibold text-accent" : "text-fg"}>{p.company}</span>
                  {p.listingNote && <div className="text-xs text-gray-500">{p.listingNote}</div>}
                </td>
                <td className="py-2 pr-3 whitespace-nowrap">
                  {p.onePhotoFrom ? "from " : ""}
                  {usd(p.listing(4))}
                </td>
                <td className="py-2 whitespace-nowrap">
                  {p.onePhotoFrom ? "from " : ""}
                  {usd(p.listing(6))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4">
        Want the number for your own listings? The free{" "}
        <Link href="/free/virtual-staging-cost-calculator">virtual staging cost calculator</Link> takes your photos per
        listing and listings per month and compares paying per photo with a subscription.
      </p>

      <h2>Extras that change the bill</h2>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-2 pr-3">Extra</th>
              <th className="py-2">Published prices</th>
            </tr>
          </thead>
          <tbody>
            {EXTRAS.map((e) => (
              <tr key={e.extra} className="border-t border-line align-top">
                <td className="py-2 pr-3 font-semibold text-fg">{e.extra}</td>
                <td className="py-2">{e.prices}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-4">
        <li><strong>Versions and revisions.</strong> Check how many versions of each photo you get and what a redo costs.</li>
        <li><strong>Subscriptions.</strong> The per-photo price of a plan is only low if you use its credits every month, and the cheapest monthly price usually means paying for the year up front.</li>
        <li><strong>Disclosure.</strong> Most MLSs, and California&apos;s AB 723, require staged photos to be disclosed; labeled copies save you time (see the <Link href="/guides/ab-723-virtual-staging">AB 723 checklist</Link>).</li>
        <li><strong>The photo you start with.</strong> A dark, tilted or fisheye photo stages badly at any price (see <Link href="/guides/photographing-rooms-for-virtual-staging">10 photo tips</Link>).</li>
      </ul>

      <h2>Virtual vs. physical staging</h2>
      <p>
        According to the National Association of REALTORS® 2025 Profile of Home Staging, the median cost of using a staging
        service was <strong>$1,500</strong>, and <strong>$500</strong> when the sellers&apos; agent staged the home
        themselves. The same survey found that 83% of buyers&apos; agents say staging makes it easier for a buyer to picture
        the property as a future home, 49% of sellers&apos; agents saw staging reduce time on market, and 29% reported a 1–10%
        increase in offer value. Those figures are for staging in general, not only virtual staging, but they explain why
        agents stage at all; virtual staging gets the online photos for a fraction of the price.
      </p>

      <h2>How to choose</h2>
      <ul>
        <li>
          <strong>One listing now and then, and you want it today:</strong> pay per photo with AI, about{" "}
          {range(R.aiPerPhoto)} a photo in minutes. Several let you try a photo free first (see{" "}
          <Link href="/guides/free-virtual-staging">what&apos;s free in virtual staging</Link>).
        </li>
        <li>
          <strong>A difficult room, or you want a designer&apos;s eye:</strong> a design service, {range(R.designerOnePhoto)}{" "}
          for one photo and one to two days. Styldod and Padstyler cut their price by about a third from 8 photos.
        </li>
        <li>
          <strong>You stage every month:</strong> a subscription is the cheapest per photo, as long as you use the credits.
        </li>
        <li>
          <strong>Happy to arrange the furniture yourself:</strong> a do-it-yourself editor, such as Apply Design&apos;s at
          $7–$10 a photo.
        </li>
      </ul>

      <h2>Our price</h2>
      <p>
        <Link href="/tools/virtual-staging">ORVIONIS Virtual Staging</Link> is $15 per photo, or $49 for a whole listing (up
        to five rooms plus the MLS description, then $10 a room, $99 for ten), up to ten rooms per order, with two staged versions of each photo in about two minutes and{" "}
        <Link href="/guides/virtual-staging-styles">six styles</Link>. Walls, floors and windows stay as photographed; if
        the room&apos;s structure was changed or the result is unusable, one redo is included, otherwise a refund. Every order
        comes with a disclosure pack (labeled copies and a link to the original). Your first photo is free (one per person), and
        you can also see a free watermarked preview of your own photo before you pay. Photographers and teams who stage every
        week can prepay <Link href="/tools/pro-credits">25 rooms for $149</Link> (about $5.96 a room, valid 12 months, no logo
        on the files).
      </p>
      <p>
        <Link href="/tools/virtual-staging#order" className="btn-primary no-underline">
          Stage your first photo free
        </Link>
      </p>

      <h2>Questions agents ask</h2>
      {FAQ.map((f) => (
        <div key={f.q}>
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </div>
      ))}

      <h2>Sources</h2>
      <p className="text-sm">
        Every price was read on the company&apos;s own page on {PRICES_CHECKED}. Prices change; follow the links for the current
        figures.
      </p>
      <ul className="text-sm">
        {sources.map((p) => (
          <li key={p.key}>
            {p.name}:{" "}
            {p.sources.map((s, i) => (
              <span key={s.href}>
                {i > 0 && "; "}
                <a href={s.href} rel="nofollow noopener" target="_blank">
                  {s.label}
                </a>
              </span>
            ))}
          </li>
        ))}
        <li>Extras: the same pages.</li>
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
