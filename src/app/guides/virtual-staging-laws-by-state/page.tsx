import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { STAGING_PRICE_LINE } from "@/config/staging-pricing";

const SLUG = "virtual-staging-laws-by-state";
const TITLE = "Virtual staging laws by state: California, Wisconsin and the bills in New York and New Jersey";
/** Search-result title: agents type "virtual staging laws by state", "is virtual staging legal" or their state's name. */
const SEO_TITLE = "Virtual staging laws by state (2026): California, Wisconsin, NY, NJ";
const DESCRIPTION =
  "California has required a label and the original since January 2026; Wisconsin's Act 69 starts January 1, 2027; New York and New Jersey have bills. Checklist.";

const CA_BILL = "https://legiscan.com/CA/text/AB723/id/3272851";
const CA_DRE = "https://www.dre.ca.gov/Licensees/Advisories/Advisory_2026_03_17_AI_in_California_Real_Estate.html";
const WI_ACT = "https://docs.legis.wisconsin.gov/2025/related/acts/69";
const WI_MEMO = "https://dsps.wi.gov/Documents/BoardCouncils/REB/REF/January%202026%20WRA%20Memo%20and%20Materials.pdf";
const WI_CLOSE = "https://theclose.com/news-ai-listing-photo-rules/";
const NY_A11635 = "https://www.nysenate.gov/legislation/bills/2025/A11635";
const NY_S9584 = "https://www.nysenate.gov/legislation/bills/2025/S9584";
const NJ_RELEASE = "https://www.assemblydems.com/CivicAlerts.aspx?AID=13079";
const NJ_SUMMARY = "https://www.oslaw.com/news/2026-06-22-proposed-new-jersey-legislation-signals-expanding-ai-compliance-obligations";
const FL_RULE = "https://www.law.cornell.edu/regulations/florida/Fla-Admin-Code-Ann-R-61J2-10-025";
const TX_STATUTE = "https://statutes.capitol.texas.gov/?tab=1&code=OC&chapter=OC.1101&artSec=1101.652";
const AZ_RULE = "https://apps.azsos.gov/public_services/Title_04/4-28.pdf";
const BRIGHT_POLICY =
  "https://assets.ctfassets.net/1g8q1frp41ix/57NAS71dVeHqmiBhfaMl0Y/fb68c2776bec92fa67d83d566d1e802f/Bright_-_Policy_on_Images_and_Documents_in_the_MLS_2282024.pdf";
const NAEBA = "https://naeba.org/naeba-issues-guidance-on-virtual-staging-and-digital-photo-alterations-in-real-estate/";

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `/guides/${SLUG}` },
  openGraph: { type: "article", title: `${TITLE} | ${site.name}`, description: DESCRIPTION, url: `${site.url}/guides/${SLUG}`, images: [{ url: "/img/sample-virtual-staging-og.jpg", width: 540, height: 630 }] },
};

/** One row per state in the summary table. */
const STATES: { state: string; law: string; status: string; asks: string }[] = [
  {
    state: "California",
    law: "AB 723 (Business and Professions Code § 10140.8)",
    status: "In effect since January 1, 2026",
    asks: "A statement on or next to each altered image, and access to the unaltered original",
  },
  {
    state: "Wisconsin",
    law: "2025 Wisconsin Act 69 (Wis. Stat. § 452.136 (1m))",
    status: "Takes effect January 1, 2027",
    asks: "Disclosure when advertising is altered with technology, AI included (full wording below); how and where is left to the firm",
  },
  {
    state: "New York",
    law: "Bills A11635 and S9584",
    status: "In committee (October 2026)",
    asks: "A label on or next to altered images and the original online (A11635); a note that furnishings or finishes were digitally added (S9584)",
  },
  {
    state: "New Jersey",
    law: "Bill A4728",
    status: "Advanced by the Assembly Housing Committee on May 14, 2026",
    asks: "No fundamental alterations; staging of movable items allowed with disclosure, originals on request, photos no older than five years",
  },
  {
    state: "Florida, Texas, Arizona",
    law: "No statute written for altered photos (as checked)",
    status: "—",
    asks: "The general rule against misleading advertising, plus your MLS's photo rules",
  },
];

const FAQ = [
  {
    q: "Which states have virtual staging laws?",
    a: "The two we know of, as of October 2026: California's AB 723, in effect since January 1, 2026, requires a label on or next to each altered listing photo and access to the original; Wisconsin's 2025 Act 69 adds a disclosure rule for advertising altered with technology from January 1, 2027. New York (A11635 and S9584) and New Jersey (A4728) have bills that haven't passed.",
  },
  {
    q: "Is virtual staging legal in Wisconsin?",
    a: "Yes. From January 1, 2027, 2025 Wisconsin Act 69 requires licensees to disclose in all advertising when it has been altered with technology, artificial intelligence included, to add, remove or change elements of the property “that creates a false or misleading impression of the property.” The act doesn't say how or where to disclose; labeling each staged photo and noting it in the remarks covers both.",
  },
  {
    q: "Does Wisconsin's law require the original photo?",
    a: "No. Unlike California's AB 723, Act 69 only requires the disclosure. Your MLS may still ask for the original: The Close reported in September 2026 that Metro MLS (Milwaukee) wants it immediately before the altered photo.",
  },
  {
    q: "Is New York's virtual staging law in effect?",
    a: "No. As of October 16, 2026, both bills are in committee: A11635 in the Assembly Housing Committee and S9584 in the Senate Judiciary Committee. A11635 would take effect 60 days after becoming law; S9584 immediately.",
  },
  {
    q: "Do I have to disclose virtual staging in a state without a law?",
    a: "Usually yes, through your MLS: Stellar MLS, ARMLS, HAR, SABOR and Bright MLS all require it in some form. State advertising rules (Florida's 61J2-10.025, Texas Occupations Code §1101.652(b)(23), Arizona's R4-28-502) forbid misleading ads, and NAR's Code of Ethics asks REALTORS® for a true picture in their advertising.",
  },
];

/**
 * State laws on digitally altered listing photos, built only from texts read on 16 Oct 2026: AB 723's bill text and the
 * DRE's 17 Mar 2026 AI advisory (California); 2025 Wisconsin Act 69 as reproduced in the WRA's January 2026 forms memo
 * on the DSPS site (docs.legis.wisconsin.gov itself could not be fetched, so it is linked, not quoted from there), The
 * Close's 3 Sep 2026 report on Metro MLS (Metro MLS's own page could not be fetched); the bill pages and texts of
 * New York's A11635 and S9584 on nysenate.gov; New Jersey's A4728 from the sponsors' 15 May 2026 release and O'Toole
 * Scrivo's 22 Jun 2026 summary (the bill text itself was not found); Florida's rule 61J2-10.025 (Cornell LII); Bright
 * MLS's Policy on Images and Documents (dated 28 Feb 2024). Texas and Arizona come from the board guides' sources.
 */
export default function StateLawsGuidePage() {
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    image: `${site.url}/img/sample-virtual-staging-og.jpg`,
    datePublished: "2026-10-16",
    dateModified: "2026-10-16",
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: `${site.url}/brand/orvionis-logo-512.png` } },
    mainEntityOfPage: `${site.url}/guides/${SLUG}`,
  };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <div className="container-x max-w-3xl py-12 prose-basic">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <p className="eyebrow">Guide · State laws · updated October 2026</p>
      <h1 className="mt-3">{TITLE}</h1>
      <p>
        Two states have a law written for digitally altered listing photos. California&apos;s has applied since January 1, 2026: a label on or next to each altered photo and access
        to the original. Wisconsin&apos;s starts on January 1, 2027. New York and New Jersey have bills in their legislatures. Everywhere else, the general rule against misleading
        advertising applies, and your MLS&apos;s photo rules are the ones you&apos;ll meet first. Each law and bill is below with its source, then one checklist that covers them all.
      </p>

      <h2>At a glance</h2>
      <div className="not-prose overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr>
              <th className="py-2 pr-3">State</th>
              <th className="py-2 pr-3">Law or bill</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2">What it asks for</th>
            </tr>
          </thead>
          <tbody>
            {STATES.map((s) => (
              <tr key={s.state} className="border-t border-line align-top">
                <td className="py-2 pr-3 font-semibold text-fg">{s.state}</td>
                <td className="py-2 pr-3">{s.law}</td>
                <td className="py-2 pr-3">{s.status}</td>
                <td className="py-2">{s.asks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>California: AB 723, in effect since January 1, 2026</h2>
      <p>
        AB 723 added section 10140.8 to the Business and Professions Code. It covers images changed with photo-editing software or AI to add, remove or alter elements, such as
        furniture, fixtures, flooring, walls or landscaping, in advertising for the sale of property by brokers, salespersons and people acting for them. Lighting, color, cropping and
        similar adjustments that don&apos;t change how the property is represented are excluded.
      </p>
      <ul>
        <li>
          <strong>A statement that the image was altered</strong>, reasonably conspicuous, on or next to the image.
        </li>
        <li>
          <strong>Access to the original:</strong> on a website you control, the unaltered photo alongside it or a link to it; elsewhere, a link, URL or QR code to a public page with
          the original.
        </li>
        <li>
          <strong>The regulator&apos;s reading:</strong> the Department of Real Estate&apos;s March 17, 2026 advisory on AI says licensees &ldquo;must also make the original, unaltered
          image available to consumers,&rdquo; and that skipping a review of AI-edited images &ldquo;may result in violations even if the alteration was unintentional.&rdquo;
        </li>
      </ul>
      <p>
        <Link href="/guides/ab-723-virtual-staging">Our AB 723 checklist</Link> has the steps for each place a photo appears, and how CRMLS, SDMLS and Bay East apply the law.
      </p>

      <h2>Wisconsin: 2025 Act 69, from January 1, 2027</h2>
      <p>
        Wisconsin&apos;s act was enacted on December 9, 2025 and takes effect on January 1, 2027. Its section 4 adds a subsection headed &ldquo;Advertising enhanced by
        technology&rdquo; to the real estate practice law (Wis. Stat. § 452.136 (1m)):
      </p>
      <blockquote>
        &ldquo;A licensee shall in all advertising disclose if the advertising has been altered or modified using technology, including artificial intelligence, to add, remove, or
        change elements of the property that creates a false or misleading impression of the property.&rdquo;
      </blockquote>
      <ul>
        <li>
          <strong>All advertising:</strong> the MLS, portals, your website, flyers and social posts alike.
        </li>
        <li>
          <strong>How and where are left open.</strong> The Wisconsin REALTORS® Association&apos;s January 2026 forms memo notes that the law doesn&apos;t say how or where to
          disclose and leaves it to the firm; the association asked whether the listing contract should remind sellers and agents of the rule.
        </li>
        <li>
          <strong>No original-photo rule.</strong> Unlike California&apos;s law, the act doesn&apos;t ask for access to the unaltered photo.
        </li>
        <li>
          <strong>The last clause.</strong> The sentence ends with &ldquo;that creates a false or misleading impression of the property&rdquo;, and the act doesn&apos;t define that
          phrase or say whether furniture-only staging falls under it. Disclosing every staged photo avoids the question, and it&apos;s what California and most MLSs already ask for.
        </li>
      </ul>
      <p>
        MLS rules apply on top. The Close reported on September 3, 2026 that Metro MLS (Milwaukee area) requires, from September 1, the original photo immediately before the altered
        one, a watermark on the altered photo and the changes noted in the public remarks, with a $10-a-day sanction for an altered primary photo until it&apos;s replaced and a separate
        $10 sanction for a missing watermark. Check Metro MLS&apos;s own notice for the details. The same act also changes how real estate firms may be paid; that part isn&apos;t
        about photos.
      </p>

      <h2>New York: two bills, not law yet</h2>
      <p>Neither bill had passed a house of the Legislature when we checked on October 16, 2026.</p>
      <h3>A11635 (Assemblymember Rosenthal)</h3>
      <p>Introduced on July 29, 2026 and referred to the Assembly Housing Committee. It would add section 443-b to the Real Property Law.</p>
      <ul>
        <li>
          Covers still photos altered with photo-editing software or AI to add, remove or change elements such as furniture, appliances, flooring and walls, and images created in
          whole or in part by generative AI.
        </li>
        <li>A statement that the image has been altered, &ldquo;conspicuously located on or adjacent to each altered image.&rdquo;</li>
        <li>Online, the unaltered version of each altered image, or a link to the original.</li>
        <li>Not covered: lighting, sharpening, white balance, color correction, angle, straightening, cropping and exposure, as long as they don&apos;t change the property&apos;s conditions.</li>
        <li>It would take effect 60 days after becoming law.</li>
      </ul>
      <h3>S9584 (Senator May; the Assembly version is A11403)</h3>
      <p>
        Introduced on March 26, 2026; the Consumer Protection Committee reported it on April 28, 2026, and it is now in the Senate Judiciary Committee. It would add section 349-i to
        the General Business Law.
      </p>
      <ul>
        <li>A clear and conspicuous disclosure on any image, video or virtual tour with material alterations.</li>
        <li>Where virtual staging is used, a disclosure &ldquo;that furnishings or finishes were digitally added.&rdquo;</li>
        <li>No digital alteration may add non-existent physical features or remove or conceal known material defects.</li>
        <li>Virtual tours may not show spaces or features that don&apos;t exist, and AI-generated elements must be clearly labeled.</li>
        <li>Enforced by the Department of State (license suspension, revocation or fines) and the Attorney General; it would take effect immediately.</li>
      </ul>

      <h2>New Jersey: A4728, not law yet</h2>
      <p>
        Introduced on March 10, 2026; the Assembly Housing Committee advanced it on May 14, 2026, the latest step we could confirm. As amended, according to the sponsors&apos; release
        and a law firm&apos;s summary:
      </p>
      <ul>
        <li>No listing photos created or edited with generative AI or photo-editing software in a way that fundamentally alters the image.</li>
        <li>
          Adding or removing furniture and other movable items (virtual staging, decluttering) is allowed if the photo otherwise shows the property&apos;s actual condition and
          doesn&apos;t hide defects.
        </li>
        <li>Disclose that AI or editing software was used, and give the original photos on request.</li>
        <li>Photos must show the current condition and be no more than five years old.</li>
        <li>
          Sellers face civil penalties of $500, then up to $1,000 for each later offense; agents, discipline by the New Jersey Real Estate Commission. It would apply to properties first
          listed after it takes effect.
        </li>
      </ul>

      <h2>Florida, Texas, Arizona and other states</h2>
      <p>
        In the states we have checked for our guides, no statute is written for altered listing photos, so the general advertising rule applies. Florida&apos;s rule 61J2-10.025 says no
        licensee&apos;s advertisement &ldquo;shall be fraudulent, false, deceptive or misleading&rdquo;. Texas lets TREC act against an advertisement that &ldquo;tends to create a
        misleading impression&rdquo; (Occupations Code §1101.652(b)(23)). Arizona&apos;s R4-28-502 bans &ldquo;misleading or ambiguous impressions&rdquo;. Wherever they work,
        NAR&apos;s Code of Ethics asks REALTORS® for a &ldquo;true picture&rdquo; in their advertising.
      </p>
      <p>In practice, your MLS&apos;s photo rule is the one you&apos;ll meet first:</p>
      <ul>
        <li>
          <strong>Stellar MLS (Central Florida):</strong> no words on photos; &ldquo;Virtually staged&rdquo; in each staged photo&apos;s description, the virtually staged field ticked
          and a line in the remarks. <Link href="/guides/stellar-mls-virtual-staging">The Stellar checklist</Link>.
        </li>
        <li>
          <strong>ARMLS (Phoenix area):</strong> the Flexmls Digitally Altered watermark on each altered photo and the original directly before or after it.{" "}
          <Link href="/guides/armls-virtual-staging">The ARMLS rule</Link>.
        </li>
        <li>
          <strong>HAR and SABOR (Texas):</strong> furnishings and wall décor only, marked in the photo description.{" "}
          <Link href="/guides/texas-virtual-staging-rules">The Texas rules</Link>.
        </li>
        <li>
          <strong>Bright MLS (Mid-Atlantic):</strong> virtually staged photos &ldquo;must be disclosed in the MLS&rdquo;; adding or removing visual elements outside the owner&apos;s
          control is prohibited, while adding personal property that doesn&apos;t convey is permitted (its Policy on Images and Documents, in the version dated February 28, 2024).
        </li>
      </ul>
      <p>
        The wording to paste in each place, the photo, the caption, the remarks, ads and social, is in our{" "}
        <Link href="/guides/virtual-staging-disclaimer">virtual staging disclaimer examples</Link>.
      </p>

      <h2>One checklist for every state</h2>
      <p>Our suggestion, written to satisfy the strictest of the rules above:</p>
      <ol>
        <li>
          <strong>Keep the original</strong> of every photo you stage.
        </li>
        <li>
          <strong>Stage, don&apos;t renovate:</strong> movable furniture and décor only; walls, floors, fixtures, views and defects stay as photographed.
        </li>
        <li>
          <strong>Disclose every staged photo</strong>, even where the law is vague or there isn&apos;t one yet: on or next to the photo where words are allowed, in the field your MLS
          uses where they aren&apos;t.
        </li>
        <li>
          <strong>Give buyers the original:</strong> next to the staged photo on your own site, a link or QR code elsewhere (required in California, proposed in New York and New
          Jersey).
        </li>
        <li>
          <strong>Follow your MLS&apos;s field and watermark rules</strong>; most are more specific than the laws.
        </li>
        <li>
          <strong>Keep labels on reposts and ads</strong>; don&apos;t crop them off.
        </li>
      </ol>

      <h2>How ORVIONIS fits</h2>
      <p>
        Every <Link href="/tools/virtual-staging">Virtual Staging</Link> order comes with a disclosure pack: clean versions with no words or logo for MLSs that ban text, copies
        labeled &ldquo;Virtually staged&rdquo; for ads, social posts and flyers, a public page with the unaltered original plus a QR code to it, and the line to paste next to the photo.
        Walls, floors, windows and fixtures are kept as photographed. Pricing: {STAGING_PRICE_LINE}. Your first photo is free, so you can try it on a real listing first.
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
          <a href={CA_BILL} target="_blank" rel="noopener noreferrer">
            California AB 723 bill text (adds Business and Professions Code § 10140.8)
          </a>
        </li>
        <li>
          <a href={CA_DRE} target="_blank" rel="noopener noreferrer">
            California DRE — Artificial Intelligence in California Real Estate (advisory, March 17, 2026)
          </a>
        </li>
        <li>
          <a href={WI_ACT} target="_blank" rel="noopener noreferrer">
            2025 Wisconsin Act 69 (enacted December 9, 2025; effective January 1, 2027)
          </a>
        </li>
        <li>
          <a href={WI_MEMO} target="_blank" rel="noopener noreferrer">
            Wisconsin REALTORS® Association — forms memo to the DSPS advisory council with the text of Act 69 (January 2026)
          </a>
        </li>
        <li>
          <a href={WI_CLOSE} target="_blank" rel="noopener noreferrer">
            The Close — how far can agents edit a listing photo (September 3, 2026), on Metro MLS
          </a>
        </li>
        <li>
          <a href={NY_A11635} target="_blank" rel="noopener noreferrer">
            New York Assembly bill A11635 (2025–2026 session)
          </a>
        </li>
        <li>
          <a href={NY_S9584} target="_blank" rel="noopener noreferrer">
            New York Senate bill S9584 (2025–2026 session)
          </a>
        </li>
        <li>
          <a href={NJ_RELEASE} target="_blank" rel="noopener noreferrer">
            New Jersey Assembly Democrats — A4728 clears the Housing Committee (May 15, 2026)
          </a>
        </li>
        <li>
          <a href={NJ_SUMMARY} target="_blank" rel="noopener noreferrer">
            O&apos;Toole Scrivo — proposed New Jersey legislation on AI (June 22, 2026), on A4728
          </a>
        </li>
        <li>
          <a href={FL_RULE} target="_blank" rel="noopener noreferrer">
            Florida Administrative Code 61J2-10.025, Advertising
          </a>
        </li>
        <li>
          <a href={TX_STATUTE} target="_blank" rel="noopener noreferrer">
            Texas Occupations Code §1101.652(b)(23)
          </a>
        </li>
        <li>
          <a href={AZ_RULE} target="_blank" rel="noopener noreferrer">
            Arizona Administrative Code, Title 4, Chapter 28 — R4-28-502, Advertising by a Licensee
          </a>
        </li>
        <li>
          <a href={BRIGHT_POLICY} target="_blank" rel="noopener noreferrer">
            Bright MLS — Policy on Images and Documents in the MLS (dated February 28, 2024), section 4.E
          </a>
        </li>
        <li>
          <a href={NAEBA} target="_blank" rel="noopener noreferrer">
            NAEBA — guidance on virtual staging and digital photo alterations (March 2026), on NAR Article 12
          </a>
        </li>
      </ul>
      <p className="text-sm text-gray-500">
        General information, not legal advice. Checked against the pages above on October 16, 2026; bills change and laws get amended, so check the current text and your
        broker&apos;s policy.
      </p>
    </div>
  );
}
