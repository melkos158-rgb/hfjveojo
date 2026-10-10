import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { STAGING_PRICE_LINE } from "@/config/staging-pricing";

const SLUG = "virtual-staging-disclaimer";
const TITLE = "Virtual staging disclaimer examples: what to write and where (2026)";
const DESCRIPTION =
  "Copy-ready virtual staging disclosure wording for the photo, the MLS caption, the remarks, ads and social, and what Stellar, ARMLS, CRMLS and AB 723 require.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `/guides/${SLUG}` },
  openGraph: { type: "article", title: `${TITLE} | ${site.name}`, description: DESCRIPTION, url: `${site.url}/guides/${SLUG}`, images: [{ url: "/img/sample-virtual-staging-og.jpg", width: 540, height: 630 }] },
};

/** Where a staged photo shows up, what to write there, and the rule behind it. "Ours" marks wording we suggest rather than a board's own. */
const WORDING: { where: string; write: string; rule: string; ours?: boolean }[] = [
  {
    where: "On the photo itself (a label)",
    write: "Virtually staged",
    rule: "“Digitally altered” works too, and covers removals. California's AB 723 wants the statement on or next to the image. Not on Stellar MLS, which allows no words on photos, or ARMLS, which allows only its own Digitally Altered watermark.",
  },
  {
    where: "The MLS photo description or caption",
    write: "Virtually staged",
    rule: "Stellar MLS: required in each staged photo's description. CRMLS: label the altered image in the photo description field. SABOR (San Antonio): pick “virtually staged” in the photo description list. Bay East: the Label option (“altered”, “digitally altered” or “AI altered”).",
  },
  {
    where: "The public remarks",
    write: "One or more photo(s) was virtually staged.",
    rule: "Stellar MLS: the remarks must start with exactly these words. Elsewhere it is a good habit, not a rule.",
  },
  {
    where: "Next to the photo on your website, a portal or a flyer (California)",
    write: "Virtually staged (digitally altered image). Original photo: [link]",
    rule: "AB 723: a statement on or next to the image, and access to the original through a link, URL or QR code when it isn't shown alongside.",
    ours: true,
  },
  {
    where: "Social posts and ads",
    write: "Photos virtually staged.",
    rule: "In the caption, with the label on the image too. NAR's Code of Ethics (Article 12) asks REALTORS® for a “true picture” in advertising; in Arizona, the licensee advertising rule bans “misleading or ambiguous impressions”.",
    ours: true,
  },
];

const FAQ = [
  {
    q: "Do I have to disclose virtual staging?",
    a: "In California, yes: AB 723 has required it for digitally altered listing photos since January 1, 2026. Elsewhere your MLS usually does: Stellar MLS, ARMLS, CRMLS and SABOR all have written rules for it. And NAR's Code of Ethics asks REALTORS® to present a true picture in their advertising.",
  },
  {
    q: "What's the difference between “virtually staged” and “digitally altered”?",
    a: "“Virtually staged” says furniture or décor was added. “Digitally altered” is broader and also covers things removed or changed. ARMLS uses “Digitally Altered” for all of it, and AB 723 speaks of digitally altered images. Use the term your board uses.",
  },
  {
    q: "Can I put the disclaimer only in the remarks?",
    a: "Not on Stellar MLS, which wants it in each staged photo's description, the virtually staged field and the remarks, or on ARMLS, which wants its watermark on the photo. Elsewhere, the closer to the photo the better: AB 723 asks for it on or next to the image.",
  },
  {
    q: "Does a disclaimer make any edit acceptable?",
    a: "No. Boards ban misleading edits even when disclosed: ARMLS rules out features the home doesn't have, such as a fireplace, a pool or a garage, and Stellar MLS bans hiding damage and changing fixtures, paint or views.",
  },
  {
    q: "Do I need to show the original photo?",
    a: "In California and on ARMLS, yes: CRMLS and ARMLS want it directly before or after the staged photo, and AB 723 wants buyers to have access to it. Keep the original of every room you stage either way.",
  },
];

/**
 * The disclosure wording agents search for ("virtual staging disclaimer"), per place the photo appears, built only from
 * rules already checked for the board guides (Stellar MLS, ARMLS, AB 723 / CRMLS / Bay East, SABOR) plus NAEBA's 2026
 * summary of NAR Article 12. Wording we suggest is marked as ours.
 */
export default function VirtualStagingDisclaimerGuide() {
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    image: `${site.url}/img/sample-virtual-staging-og.jpg`,
    datePublished: "2026-10-10",
    dateModified: "2026-10-10",
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: `${site.url}/brand/orvionis-logo-512.png` } },
    mainEntityOfPage: `${site.url}/guides/${SLUG}`,
  };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <div className="container-x max-w-3xl py-12 prose-basic">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <p className="eyebrow">Guide · Disclosure · updated October 2026</p>
      <h1 className="mt-3">Virtual staging disclaimer: what to write and where</h1>
      <p>
        The disclaimer itself is short. Where it goes is what trips agents up: some MLSs want words on the photo, others ban any words on photos, and California law wants a statement
        next to the image plus access to the original. Below is the wording to copy for each place a staged photo appears, with the rule that decides it.
      </p>

      <h2>The wording, place by place</h2>
      <div className="not-prose space-y-3">
        {WORDING.map((w) => (
          <div key={w.where} className="rounded-xl border border-line p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{w.where}</p>
            <p className="mt-2 font-mono text-sm text-fg">{w.write}</p>
            <p className="mt-2 text-sm text-gray-600">
              {w.rule}
              {w.ours ? <span className="text-gray-500"> (Suggested wording, not a board&apos;s own.)</span> : null}
            </p>
          </div>
        ))}
      </div>

      <h2>By board and state</h2>
      <ul>
        <li>
          <strong>Stellar MLS (Central Florida):</strong> no words on photos; &ldquo;Virtually staged&rdquo; in each staged photo&apos;s description, the virtually staged field
          ticked, and the remarks starting with &ldquo;One or more photo(s) was virtually staged.&rdquo; <Link href="/guides/stellar-mls-virtual-staging">The Stellar checklist</Link>.
        </li>
        <li>
          <strong>ARMLS (Phoenix area):</strong> the Flexmls Digitally Altered watermark on each altered photo and the original directly before or after it; one watermark per photo, and
          $200 fines from December 2026. <Link href="/guides/armls-virtual-staging">The ARMLS rule</Link>.
        </li>
        <li>
          <strong>California (AB 723):</strong> a statement on or next to the image and access to the original. CRMLS wants the label in the photo description and the original
          immediately before or after; Bay East uses a Label option. <Link href="/guides/ab-723-virtual-staging">The AB 723 checklist</Link>.
        </li>
        <li>
          <strong>SABOR (San Antonio):</strong> staging limited to furnishings and wall décor, disclosed by picking &ldquo;virtually staged&rdquo; in the photo description list
          (rules revised September 18, 2024).
        </li>
        <li>
          <strong>Everywhere:</strong> NAR&apos;s Code of Ethics asks REALTORS® to present a &ldquo;true picture&rdquo; in their advertising, online images included. Check your own
          board&apos;s rule before you upload; the listing agent and broker stay responsible whoever edited the photos.
        </li>
      </ul>

      <h2>What needs a disclaimer</h2>
      <ul>
        <li>
          <strong>Yes:</strong> virtual staging (furniture and décor added), decluttering or removing items, and changes to paint, flooring or other finishes.
        </li>
        <li>
          <strong>No:</strong> brightness, color and cropping adjustments that don&apos;t change what is in the photo; AB 723 and ARMLS both list edits like these as not
          covered.
        </li>
      </ul>

      <h2>How ORVIONIS helps</h2>
      <p>
        Every <Link href="/tools/virtual-staging">Virtual Staging</Link> order comes with what each place needs: clean versions with no words or logo for boards like Stellar MLS and
        ARMLS, copies labeled &ldquo;Virtually staged&rdquo; for ads, social posts and flyers, a public page with the original photo plus a QR code to it, and the disclosure line ready to
        paste. Pricing: {STAGING_PRICE_LINE}. Your first photo is free.
      </p>
      <p>
        <Link href="/tools/virtual-staging#order" className="btn-primary no-underline">
          Stage your first photo free
        </Link>
      </p>

      <h2>Questions</h2>
      {FAQ.map((f) => (
        <div key={f.q}>
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </div>
      ))}

      <h2>Sources</h2>
      <ul>
        <li>
          <a href="https://rules.stellarmls.com/hc/en-us/articles/14692987795095-Article-04-04-Virtually-Staged-Photos" target="_blank" rel="noopener noreferrer">
            Stellar MLS Rules — Article 4.4, Virtually Staged Photos
          </a>
        </li>
        <li>
          <a href="https://armls.com/digitally-altered-media" target="_blank" rel="noopener noreferrer">
            ARMLS — Digitally Altered Media (Rule 8.23)
          </a>
        </li>
        <li>
          <a href="https://legiscan.com/CA/text/AB723/id/3272851" target="_blank" rel="noopener noreferrer">
            AB 723 bill text (2025–2026 session)
          </a>
        </li>
        <li>
          <a href="https://kb.crmls.org/knowledgebase/digitally-altered-images-faqs/" target="_blank" rel="noopener noreferrer">
            CRMLS — Digitally Altered Images FAQs
          </a>
        </li>
        <li>
          <a href="https://bayeast.org/digitally-altered-mls-photo-rule/" target="_blank" rel="noopener noreferrer">
            Bay East — Digitally Altered MLS Photo Rule
          </a>
        </li>
        <li>
          <a href="https://sabor.com/wp-content/uploads/2024/09/MLS-Rules-Update-Clean-copy-2.pdf" target="_blank" rel="noopener noreferrer">
            SABOR MLS Rules and Regulations (revised September 18, 2024), section 1.2(b)
          </a>
        </li>
        <li>
          <a href="https://naeba.org/naeba-issues-guidance-on-virtual-staging-and-digital-photo-alterations-in-real-estate/" target="_blank" rel="noopener noreferrer">
            NAEBA — guidance on virtual staging and digital photo alterations (March 2026), on NAR Article 12
          </a>
        </li>
      </ul>
      <p className="text-sm text-gray-500">General information, not legal advice. Checked against each source on October 10, 2026; rules change, so check the current version and your broker&apos;s policy.</p>
    </div>
  );
}
