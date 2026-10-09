import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { priceRanges } from "@/content/staging-prices";
import { PHOTOGRAPHER_PRICES, PHOTOGRAPHER_PRICES_CHECKED, PHOTOGRAPHER_PRICES_CHECKED_ISO, photographerPriceStats, usd } from "@/content/photographer-staging-prices";
import { CREDIT_MONTHS, CREDITS_PER_PACK } from "@/lib/orders/credit-rules";

const SLUG = "virtual-staging-pricing-for-photographers";
const TITLE = "What real estate photographers charge for virtual staging (2026)";
const PACK_PRICE = 149;

export function generateMetadata(): Metadata {
  const s = photographerPriceStats();
  const description = `${s.count} photographers' price lists checked: virtual staging runs ${usd(s.low)}–${usd(s.high)} a photo, median ${usd(s.median)}. How to price it, deliver it and keep the margin.`;
  return {
    title: TITLE,
    description,
    alternates: { canonical: `/guides/${SLUG}` },
    openGraph: { type: "article", title: `${TITLE} | ${site.name}`, description, url: `${site.url}/guides/${SLUG}`, images: [{ url: "/img/sample-virtual-staging-og.jpg", width: 540, height: 630 }] },
  };
}

/**
 * Real estate photographers (25% of the owner's outreach, court session 2) deciding whether and how to sell virtual
 * staging: what 12 photographers charge, read on their own price pages, what it costs them, how to price and deliver it,
 * and Pro credits. The numbers come from src/content/photographer-staging-prices.ts.
 */
export default function PhotographerStagingPricingGuide() {
  const s = photographerPriceStats();
  const r = priceRanges();
  const perRoom = PACK_PRICE / CREDITS_PER_PACK;
  const margin = (price: number, cost: number) => {
    const m = Math.round((price - cost) * 100) / 100;
    return m < 0 ? `−${usd(-m)}` : usd(m);
  };

  const faq = [
    {
      q: "How much should a photographer charge for virtual staging?",
      a: `On the ${s.count} price lists we checked, one staged photo costs the agent ${usd(s.low)} to ${usd(s.high)}; the median is ${usd(s.median)}, and the middle half charge ${usd(s.q1)}–${usd(s.q3)}. Several sell a pack of 4 or 5 photos for less per photo.`,
    },
    {
      q: "Should virtual staging be in the package or an add-on?",
      a: "Every photographer we checked lists it separately from the shoot, priced per photo or in a small pack. The agent picks the rooms after seeing the photos, so an add-on fits how it is ordered.",
    },
    {
      q: "Who is responsible for disclosing virtual staging?",
      a: "The listing agent and broker, under their MLS rules and state law. You help by delivering a clean version for the MLS, a labeled copy for ads, and the original photo of every room you stage.",
    },
    {
      q: "Can I put my logo on staged photos?",
      a: "Not on photos for the MLS in many areas: Stellar MLS in Florida allows no branding or words on photos, and ARMLS in Arizona allows only its own watermark. Keep your logo for your portfolio and your own ads.",
    },
    {
      q: "How fast do photographers deliver staged photos?",
      a: "The ones that say so promise 24–48 hours or up to 3 business days. AI staging returns a room in minutes, so you can deliver it with the shoot.",
    },
  ];

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    image: `${site.url}/img/sample-virtual-staging-og.jpg`,
    datePublished: PHOTOGRAPHER_PRICES_CHECKED_ISO,
    dateModified: PHOTOGRAPHER_PRICES_CHECKED_ISO,
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: `${site.url}/brand/orvionis-logo-512.png` } },
    mainEntityOfPage: `${site.url}/guides/${SLUG}`,
  };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <div className="container-x max-w-3xl py-12 prose-basic">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <p className="eyebrow">Guide · For real estate photographers · updated October 2026</p>
      <h1 className="mt-3">What real estate photographers charge for virtual staging</h1>
      <p>
        Agents with vacant listings ask their photographer for staged photos, and many photographers now sell it as an add-on. We read {s.count} photographers&apos; own price lists, most of
        them in Florida, Texas and Arizona, on {PHOTOGRAPHER_PRICES_CHECKED}: one staged photo costs the agent <strong>{usd(s.low)} to {usd(s.high)}, with a median of {usd(s.median)}</strong>.
        Here is the list, what staging costs you, and how to price and deliver it.
      </p>

      <h2>What photographers charge</h2>
      <p>Prices as each photographer publishes them; &ldquo;per photo&rdquo; is one staged photo bought alone, or a pack price divided by its photos.</p>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-2 pr-3">Photographer</th>
              <th className="py-2 pr-3">Per photo</th>
              <th className="py-2">Price as published</th>
            </tr>
          </thead>
          <tbody>
            {[...PHOTOGRAPHER_PRICES]
              .sort((a, b) => a.perPhoto - b.perPhoto)
              .map((p) => (
                <tr key={p.business} className="border-t border-line align-top">
                  <td className="py-2 pr-3">
                    <a href={p.href} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold text-fg underline">
                      {p.business}
                    </a>
                    <span className="block text-xs text-gray-500">{p.area}</span>
                  </td>
                  <td className="py-2 pr-3 font-semibold text-fg">{usd(p.perPhoto)}</td>
                  <td className="py-2">
                    {p.price}
                    {p.note ? <span className="block text-xs text-gray-500">{p.note}</span> : null}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <ul>
        <li>
          <strong>The middle half charge {usd(s.q1)}–{usd(s.q3)} a photo</strong>; the median is {usd(s.median)}.
        </li>
        <li>
          <strong>Packs are common:</strong> 4 or 5 photos for less each ($220 for 4 instead of $60 each, 5 for $200 instead of $50 each), or a lower price from the third or tenth photo.
        </li>
        <li>
          <strong>Next to the shoot:</strong> the cheapest photo packages on {s.shootCount} of these sites cost {usd(s.shootLow)}–{usd(s.shootHigh)}, so one staged photo adds roughly a fifth
          of a basic shoot.
        </li>
        <li>
          <strong>Turnaround,</strong> where stated: 24–48 hours, or up to 3 business days.
        </li>
      </ul>

      <h2>What it costs you</h2>
      <p>
        If you send rooms to a staging editor, a design service charges {usd(r.designerOnePhoto[0])}–{usd(r.designerOnePhoto[1])} for one photo ({usd(r.designerBulk[0])}–
        {usd(r.designerBulk[1])} in bulk), according to the prices in our <Link href="/guides/virtual-staging-cost">virtual staging cost guide</Link>. Resold at the median {usd(s.median)},
        that leaves {margin(s.median, r.designerOnePhoto[1])} to {margin(s.median, r.designerOnePhoto[0])} a photo before your time. AI staging costs{" "}
        {usd(r.aiPerPhoto[0])}–{usd(r.aiPerPhoto[1])} a photo bought one at a time, and less in packs, so most of the agent&apos;s price stays with you.
      </p>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-2 pr-3">You charge the agent</th>
              <th className="py-2 pr-3">Editor at {usd(r.designerOnePhoto[0])}–{usd(r.designerOnePhoto[1])}</th>
              <th className="py-2">Pro credits at {usd(Math.round(perRoom * 100) / 100)}</th>
            </tr>
          </thead>
          <tbody>
            {[25, s.median, 50].map((price) => (
              <tr key={price} className="border-t border-line">
                <td className="py-2 pr-3 font-semibold text-fg">{usd(price)} a photo</td>
                <td className="py-2 pr-3">
                  {margin(price, r.designerOnePhoto[1])} to {margin(price, r.designerOnePhoto[0])}
                </td>
                <td className="py-2">{margin(price, perRoom)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-gray-500">What you keep per staged photo, before your own time and card fees.</p>

      <h2>How to price it</h2>
      <ol>
        <li>
          <strong>Put it on your price list next to the shoot,</strong> as an add-on per photo. Agents decide which rooms after they see the photos.
        </li>
        <li>
          <strong>Add a small pack</strong> (4 or 5 photos) at a lower price per photo: a vacant listing usually needs the living room, the main bedroom and two or three more rooms (
          <Link href="/guides/which-rooms-to-virtually-stage">which rooms to stage</Link>).
        </li>
        <li>
          <strong>Say what&apos;s included:</strong> how many style options, one round of fixes, and when the photos arrive.
        </li>
        <li>
          <strong>Offer it when you book a vacant home,</strong> not after delivery: that is when the agent is deciding how the listing will look.
        </li>
      </ol>

      <h2>Deliver it so the agent stays compliant</h2>
      <ul>
        <li>
          <strong>A clean version for the MLS:</strong> no logo, no words, nothing that changes the room itself. Stellar MLS bans words on photos; ARMLS wants its own Digitally Altered watermark
          added in Flexmls.
        </li>
        <li>
          <strong>A labeled copy</strong> (&ldquo;Virtually staged&rdquo;) for ads, social posts and flyers.
        </li>
        <li>
          <strong>The original photo</strong> of every staged room: ARMLS wants it directly before or after the staged one, and California&apos;s AB 723 requires buyers to have
          access to it.
        </li>
        <li>
          <strong>Nothing hidden:</strong> walls, floors, windows, fixtures and any damage stay as photographed.
        </li>
      </ul>
      <p>
        Board by board: <Link href="/guides/stellar-mls-virtual-staging">Stellar MLS (Florida)</Link>, <Link href="/guides/armls-virtual-staging">ARMLS (Arizona)</Link>,{" "}
        <Link href="/guides/ab-723-virtual-staging">California AB 723</Link>.
      </p>

      <h2>How ORVIONIS fits</h2>
      <p>
        <Link href="/tools/pro-credits">Pro credits</Link> are {CREDITS_PER_PACK} staged rooms for ${PACK_PRICE}, about {usd(Math.round(perRoom * 100) / 100)} a room, paid once and used over{" "}
        {CREDIT_MONTHS} months. Each room comes back in about two minutes in two staged versions with no ORVIONIS mark, so you deliver them under your own name, plus labeled copies for
        ads and an optional page with the original photo. If a result changes the room or is unusable, one redo is included. Want to see the quality first? Your{" "}
        <Link href="/tools/virtual-staging#order">first photo is free</Link>.
      </p>
      <p>
        <Link href="/tools/pro-credits" className="btn-primary no-underline">
          Get {CREDITS_PER_PACK} rooms for ${PACK_PRICE}
        </Link>
      </p>
      <p>
        More for photographers: <Link href="/photographers">virtual staging for real estate photographers</Link> and{" "}
        <Link href="/guides/photographing-rooms-for-virtual-staging">10 tips for room photos that stage well</Link>.
      </p>

      <h2>Questions</h2>
      {faq.map((f) => (
        <div key={f.q}>
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </div>
      ))}

      <p className="text-sm text-gray-500">
        Prices as shown on each photographer&apos;s own website on {PHOTOGRAPHER_PRICES_CHECKED} (linked in the table); they change, so check the current page. ORVIONIS is not affiliated with
        any of them.
      </p>
    </div>
  );
}
