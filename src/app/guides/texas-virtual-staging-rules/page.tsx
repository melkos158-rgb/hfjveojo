import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { STAGING_PRICE_LINE } from "@/config/staging-pricing";

const SLUG = "texas-virtual-staging-rules";
const TITLE = "Virtual staging in Texas: what HAR, SABOR and NTREIS allow";
/** Search-result title: agents type "virtual staging rules Texas" or their MLS's name. */
const SEO_TITLE = "Virtual staging rules in Texas: HAR, SABOR and NTREIS (2026)";
const DESCRIPTION =
  "Texas MLS rules for virtual staging: HAR and SABOR allow furniture and décor if you mark the photo as virtually staged; what NTREIS and TREC add. Checklist.";

const HAR_RULES = "https://web.har.com/mls/MLSRules.pdf";
const SABOR_RULES = "https://sabor.com/wp-content/uploads/2024/09/MLS-Rules-Update-Clean-copy-2.pdf";
const METROTEX = "https://www.mymetrotex.com/common-mls-violations-to-avoid-2026/";
const STATUTE = "https://statutes.capitol.texas.gov/?tab=1&code=OC&chapter=OC.1101&artSec=1101.652";
const TREC_ADS = "https://www.trec.texas.gov/article/trecs-advertising-rules-what-you-need-know";

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `/guides/${SLUG}` },
  openGraph: { type: "article", title: `${TITLE} | ${site.name}`, description: DESCRIPTION, url: `${site.url}/guides/${SLUG}`, images: [{ url: "/img/sample-virtual-staging-og.jpg", width: 540, height: 630 }] },
};

const FAQ = [
  {
    q: "Is virtual staging legal in Texas?",
    a: "Yes. No Texas law bans it. The licensing law lets TREC act against an advertisement that misleads or is likely to deceive the public, or tends to create a misleading impression (Texas Occupations Code §1101.652(b)(23)), and MLSs such as HAR and SABOR allow staging limited to furnishings and wall décor as long as you mark the photo as virtually staged.",
  },
  {
    q: "How do I disclose virtual staging on HAR?",
    a: "HAR's Rule 1.25.1 says to clearly indicate in the Photo Description that the image has been virtually staged. A photo that changes the property itself is a different case: it needs HAR's watermark (“Image does not represent actual property as is”), can't be the primary image, and needs the unaltered photo with the same view next to it.",
  },
  {
    q: "What does SABOR require for virtually staged photos?",
    a: "SABOR's Rule 1.2(b) limits staging to furnishings and wall décor that wouldn't convey with the property, and you select the “virtually staged” option on the photo description pick list. Photos can't show people, the brokerage's or agent's signs, or contact phone numbers.",
  },
  {
    q: "Can I put “Virtually staged” text on the photo?",
    a: "On HAR and SABOR the disclosure goes in the photo description, not on the image; HAR's watermark is only for photos that alter the property itself. MetroTex asks NTREIS members not to put text across listing photos when the information belongs in an MLS field. Keep labeled copies for ads and social posts instead.",
  },
  {
    q: "Does TREC have a rule about virtual staging?",
    a: "No rule names it. A staged photo is an advertisement like any other: it may not mislead or create a misleading impression, and TREC looks at an advertisement in its entirety. Your MLS's photo rules apply on top.",
  },
];

/**
 * Texas (court session 2: Texas without Houston for outreach; Houston's HAR is still covered here for agents who
 * search). Built only from rules that could be read on 13 Oct 2026: HAR's MLS Rules 1.25 (PDF dated 12/1/2023), SABOR's
 * MLS Rules 1.2(b) (rev. 18 Sep 2024), MetroTex's May 2026 article on NTREIS violations, the Occupations Code and TREC's
 * advertising guidance. NTREIS's and Unlock MLS's own rulebooks were not on a public page we could read.
 */
export default function TexasGuidePage() {
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    image: `${site.url}/img/sample-virtual-staging-og.jpg`,
    datePublished: "2026-10-13",
    dateModified: "2026-10-13",
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: `${site.url}/brand/orvionis-logo-512.png` } },
    mainEntityOfPage: `${site.url}/guides/${SLUG}`,
  };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <div className="container-x max-w-3xl py-12 prose-basic">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <p className="eyebrow">Guide · Texas · updated October 2026</p>
      <h1 className="mt-3">{TITLE}</h1>
      <p>
        Texas has no law written for virtual staging. Two things apply instead: the state&apos;s advertising rule for license holders and your MLS&apos;s photo rules. Houston&apos;s HAR
        and San Antonio&apos;s SABOR spell it out: you may add furnishings and wall décor, and you mark the photo as virtually staged in its description. For Dallas–Fort Worth
        (NTREIS), the MetroTex association&apos;s 2026 guidance says staging is acceptable in many cases, but virtual renovations can misrepresent the home. Each rule is below with its
        source, then a checklist.
      </p>

      <h2>The state rule: no misleading advertising</h2>
      <p>
        The Texas Real Estate License Act lets TREC act against a license holder who publishes an advertisement that &ldquo;misleads or is likely to deceive the public&rdquo; or
        &ldquo;tends to create a misleading impression&rdquo; (Texas Occupations Code §1101.652(b)(23)). TREC&apos;s own advertising guidance applies the same test: a license holder
        may not &ldquo;create a misleading impression&rdquo;, and TREC considers an advertisement in its entirety. No TREC rule names virtual staging, so a staged photo is held to that
        test like the rest of the ad. The MLS rules below draw the line in practice: furniture yes; hiding defects or adding features the home doesn&apos;t have, no.
      </p>

      <h2>Houston: HAR Rule 1.25.1</h2>
      <ul>
        <li>
          <strong>Allowed:</strong> virtual staging &ldquo;limited to the addition of furnishings and wall décor&rdquo;.
        </li>
        <li>
          <strong>Disclosure:</strong> &ldquo;Participants shall clearly indicate in the Photo Description the image has been virtually staged.&rdquo;
        </li>
        <li>
          <strong>Changing the property itself</strong> (HAR&apos;s &ldquo;real property characteristics&rdquo;) is a different case. The image needs a visible, legible watermark reading
          &ldquo;Image does not represent actual property as is&rdquo;, at least 1024 × 89 pixels in Arial; it can&apos;t be the primary image; and the unaltered photo with the same
          view goes right next to it.
        </li>
        <li>
          <strong>No legible contact information</strong> (names, phone numbers, email or web addresses) in the image or the photo description.
        </li>
        <li>
          <strong>Rule 1.25.5:</strong> images must show the property in its &ldquo;as-is&rdquo; condition, and HRIS, which runs the MLS, may remove images it deems inaccurate.
        </li>
        <li>
          Most listings need at least six photos, and at least one of them must be an actual photo of the property.
        </li>
      </ul>

      <h2>San Antonio: SABOR Rule 1.2(b)</h2>
      <ul>
        <li>
          <strong>Allowed:</strong> virtual staging &ldquo;limited to the addition of furnishings and wall décor&rdquo; that would otherwise be personal property, not conveyed in the
          sale.
        </li>
        <li>
          <strong>Disclosure:</strong> select the &ldquo;virtually staged&rdquo; option on the pick list under photo description.
        </li>
        <li>
          <strong>Not allowed:</strong> digitally enhanced modifications that alter or misrepresent the condition or appearance of the structure or grounds, such as adding or
          modifying a swimming pool or landscaping, or removing power lines, utility boxes or fire hydrants.
        </li>
        <li>No people in photos, and no signs or other identification of the brokerage or agent, or contact phone numbers.</li>
        <li>At least four photos per listing.</li>
      </ul>

      <h2>Dallas–Fort Worth: NTREIS</h2>
      <p>
        NTREIS&apos;s rulebook isn&apos;t on a public page we could read, so this part comes from the MetroTex Association of REALTORS®&apos; May 2026 article on common NTREIS
        violations:
      </p>
      <ul>
        <li>&ldquo;Virtual staging is acceptable in many cases, but large-scale virtual renovations can become problematic.&rdquo;</li>
        <li>
          Photos should be &ldquo;true current photographs of the property&rdquo;, without digitally enhanced modifications that misrepresent its condition or appearance. Adding
          unrealistically green grass, or landscaping and trees that don&apos;t exist, can misrepresent the home.
        </li>
        <li>No text across listing photos when the information belongs in an MLS field, and no QR codes.</li>
        <li>NTREIS Rule 7.30 keeps the listing agent&apos;s name, phone number, email and web address out of photos and picture descriptions.</li>
      </ul>
      <p>
        The article doesn&apos;t name a disclosure field. Our suggestion, in line with HAR and SABOR rather than an NTREIS rule: mark each staged photo in its picture description and
        say it in the remarks too.
      </p>

      <h2>Austin: Unlock MLS</h2>
      <p>
        Unlock MLS&apos;s photo rules weren&apos;t on a public page we could read in October 2026. Ask Unlock MLS how it wants staged photos disclosed; until then, follow the pattern
        above: furniture and décor only, marked in the photo description, no text on the image.
      </p>

      <h2>The checklist for a Texas listing</h2>
      <ol>
        <li>
          <strong>Stage furniture and wall décor only:</strong> no new floors, walls, fixtures, views or landscaping.
        </li>
        <li>
          <strong>Compare each staged photo with the original:</strong> same room, same defects, furniture to scale.
        </li>
        <li>
          <strong>Upload the clean staged photo</strong>, without text, logo or contact details.
        </li>
        <li>
          <strong>Mark it as virtually staged where your MLS asks:</strong> HAR, the Photo Description; SABOR, the &ldquo;virtually staged&rdquo; pick-list option; NTREIS and Unlock
          MLS, the photo description (and ask your MLS).
        </li>
        <li>
          <strong>Keep the original.</strong> In Houston, a photo that changes the property itself needs HAR&apos;s watermark, can&apos;t be the primary photo, and goes next to the
          unaltered one.
        </li>
        <li>
          <strong>Off the MLS too</strong>, say the photos are virtually staged in ads, social posts and flyers.
        </li>
      </ol>

      <h2>How ORVIONIS fits these rules</h2>
      <p>
        <Link href="/tools/virtual-staging">Virtual Staging</Link> adds furniture and décor to your own room photo and is instructed to keep the walls, floors, windows and fixtures as
        photographed, the &ldquo;furnishings and wall décor&rdquo; line HAR and SABOR draw. You get two versions of each room as clean JPGs with no text or logo, ready for the MLS,
        plus copies labeled &ldquo;Virtually staged&rdquo; for ads and social posts. If a version changed something it shouldn&apos;t have, don&apos;t upload it: one redo is
        included.
      </p>
      <p>
        Pricing: {STAGING_PRICE_LINE}. Your first photo is free, so you can try it on a real listing first.
      </p>
      <p>
        <Link href="/tools/virtual-staging#order" className="btn-primary no-underline">
          Stage your first photo free
        </Link>
      </p>
      <p>
        Listing elsewhere? <Link href="/guides/stellar-mls-virtual-staging">Stellar MLS in Florida</Link> wants no words on the photo, only a description, a checkbox and a line in
        the remarks; <Link href="/guides/armls-virtual-staging">ARMLS in Arizona</Link> requires its own Flexmls &ldquo;Digitally Altered&rdquo; watermark and the original next to
        it; in California, <Link href="/guides/ab-723-virtual-staging">AB 723</Link> requires a label and access to the original. The wording for each place is in our{" "}
        <Link href="/guides/virtual-staging-disclaimer">virtual staging disclaimer examples</Link>.
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
          <a href={HAR_RULES} target="_blank" rel="noopener noreferrer">
            HAR (Houston REALTORS® Information Service) MLS Rules, dated December 1, 2023, Rules 1.25.1 and 1.25.5
          </a>
        </li>
        <li>
          <a href={SABOR_RULES} target="_blank" rel="noopener noreferrer">
            SABOR MLS Rules and Regulations (revised September 18, 2024), section 1.2(b)
          </a>
        </li>
        <li>
          <a href={METROTEX} target="_blank" rel="noopener noreferrer">
            MetroTex Association of REALTORS® — Common MLS Violations to Avoid in 2026 (May 26, 2026)
          </a>
        </li>
        <li>
          <a href={STATUTE} target="_blank" rel="noopener noreferrer">
            Texas Occupations Code §1101.652(b)(23)
          </a>
        </li>
        <li>
          <a href={TREC_ADS} target="_blank" rel="noopener noreferrer">
            TREC — TREC&apos;s Advertising Rules: What You Need to Know
          </a>
        </li>
      </ul>
      <p className="text-sm text-gray-500">
        General information, not legal advice. Checked against the pages above on October 13, 2026; rules change, so check your MLS&apos;s current version and your broker&apos;s
        policy.
      </p>
    </div>
  );
}
